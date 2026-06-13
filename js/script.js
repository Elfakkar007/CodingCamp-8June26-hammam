(function () {

  // ─── 1. CONSTANTS ──────────────────────────────────────────────

  const LS_KEY_BALANCE  = 'expenseTracker_balance';
  const LS_KEY_EXPENSES = 'expenseTracker_expenses';
  const DEFAULT_LOCALE  = 'id-ID';
  const DEFAULT_CURRENCY = 'IDR';
  const MAX_BALANCE     = 999_999_999;
  const MAX_AMOUNT      = 999_999_999.99;
  const MAX_NAME_LEN    = 250;
  const LIST_TRUNCATE   = 40;

  const CATEGORIES = {
    Food:          { color: '#0066b1' },
    Transport:     { color: '#1c69d4' },
    Entertainment: { color: '#e22718' },
    Shopping:      { color: '#f4b400' },
    Health:        { color: '#0fa336' },
    Other:         { color: '#7e7e7e' },
  };

  // ─── 2. STATE ──────────────────────────────────────────────────

  let state = {
    balance:  0,
    expenses: [],
  };

  let storageAvailable = true;
  let canvasCtx = null;
  let bannerShown = false;

  // ─── 3. LOCALSTORAGE HELPERS ───────────────────────────────────

  /**
   * Test localStorage availability once at startup.
   * @returns {boolean}
   */
  function checkStorageAvailable() {
    try {
      const testKey = '__ls_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Persist current state to localStorage.
   * No-op if storageAvailable === false.
   */
  function persistState() {
    if (!storageAvailable) return;
    localStorage.setItem(LS_KEY_BALANCE, String(state.balance));
    localStorage.setItem(LS_KEY_EXPENSES, JSON.stringify(state.expenses));
  }

  /**
   * Load balance and expenses from localStorage into state.
   * Handles missing keys and JSON parse failures gracefully.
   */
  function loadState() {
    // Load balance — default 0 on missing, NaN, or invalid
    const rawBalance = localStorage.getItem(LS_KEY_BALANCE);
    const parsedBalance = parseFloat(rawBalance);
    state.balance = (rawBalance !== null && !isNaN(parsedBalance)) ? parsedBalance : 0;

    // Load expenses — default [] on missing, JSON parse failure, or non-array
    try {
      const rawExpenses = localStorage.getItem(LS_KEY_EXPENSES);
      const parsed = rawExpenses ? JSON.parse(rawExpenses) : [];
      if (!Array.isArray(parsed)) throw new Error('Not an array');
      state.expenses = parsed;
    } catch {
      state.expenses = [];
      showStorageBanner();
    }
  }

  // ─── 4. FORMATTING HELPERS ─────────────────────────────────────

  /**
   * Format a number as a locale currency string.
   * Uses Indonesian Rupiah (IDR) formatting by default.
   * @param {number} value
   * @returns {string}  e.g. "Rp 500.000"
   */
  function formatCurrency(value) {
    return new Intl.NumberFormat(DEFAULT_LOCALE, {
      style:                 'currency',
      currency:              DEFAULT_CURRENCY,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  }

  /**
   * Truncate a string to maxLen characters, appending '…' if truncated.
   * @param {string} str
   * @param {number} maxLen
   * @returns {string}
   */
  function truncate(str, maxLen) {
    return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
  }

  /**
   * Generate a unique ID.
   * Uses crypto.randomUUID() when available, otherwise falls back to
   * a timestamp + random string combination.
   * @returns {string}
   */
  function generateId() {
    return (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  // ─── 5. VALIDATION ─────────────────────────────────────────────

  /**
   * Validate balance input.
   * @param {string} raw - Raw string from input element
   * @returns {{ valid: boolean, value?: number, error?: string }}
   */
  function validateBalance(raw) {
    const trimmed = (raw ?? '').trim();
    if (trimmed === '') {
      return { valid: false, error: 'Please enter a valid number' };
    }

    const parsed = parseFloat(trimmed);

    if (isNaN(parsed) || !isFinite(parsed)) {
      return { valid: false, error: 'Please enter a valid number' };
    }

    if (parsed <= 0 || parsed > MAX_BALANCE) {
      return { valid: false, error: 'Balance must be greater than zero' };
    }

    return { valid: true, value: parsed };
  }

  /**
   * Validate expense form inputs.
   * @param {string} name
   * @param {string} rawAmount
   * @param {string} category
   * @returns {{ valid: boolean, errors: { name?: string, amount?: string } }}
   */
  function validateExpense(name, rawAmount, category) {
    const errors = {};

    // Validate name
    const trimmedName = (name ?? '').trim();
    if (trimmedName === '') {
      errors.name = 'Item name is required';
    } else if (trimmedName.length > MAX_NAME_LEN) {
      errors.name = 'Item name must be 250 characters or fewer';
    }

    // Validate amount
    const trimmedAmount = (rawAmount ?? '').trim();
    if (trimmedAmount === '') {
      errors.amount = 'Enter a valid amount';
    } else {
      const parsed = parseFloat(trimmedAmount);
      if (isNaN(parsed) || !isFinite(parsed) || parsed <= 0 || parsed > MAX_AMOUNT) {
        errors.amount = 'Enter a valid amount';
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  // ─── 6. DOM RENDERERS ──────────────────────────────────────────

  /**
   * Compute the remaining balance after all expenses.
   * @returns {number}
   */
  function computeRemainingBalance() {
    return state.expenses.reduce((sum, e) => sum - e.amount, state.balance);
  }

  /**
   * Render the balance display value.
   * Applies balance--negative class when remaining balance < 0.
   */
  function renderBalanceDisplay() {
    const remaining = computeRemainingBalance();
    const el = document.getElementById('balance-display');
    el.textContent = formatCurrency(remaining);
    if (remaining < 0) {
      el.classList.add('balance--negative');
    } else {
      el.classList.remove('balance--negative');
    }
  }

  /**
   * Render category tab buttons inside #category-tabs.
   * Called once during init; 'Food' tab is active by default.
   */
  function renderCategoryTabs() {
    const container = document.getElementById('category-tabs');
    container.innerHTML = '';

    Object.keys(CATEGORIES).forEach(function (category) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'category-tab';
      button.textContent = category;
      button.setAttribute('data-category', category);

      if (category === 'Food') {
        button.classList.add('category-tab--active');
      }

      button.addEventListener('click', function () {
        handleCategoryTab(category);
      });

      container.appendChild(button);
    });
  }

  // Flag to ensure the delete event listener is only attached once
  let listListenerAttached = false;

  /**
   * Build a single expense row <li> element.
   * @param {Object} expense - Expense object from state
   * @returns {HTMLLIElement}
   */
  function buildExpenseRow(expense) {
    const li = document.createElement('li');
    li.dataset.id = expense.id;

    const nameEl = document.createElement('span');
    nameEl.className = 'expense-name';
    nameEl.textContent = truncate(expense.name, LIST_TRUNCATE);

    const badge = document.createElement('span');
    badge.className = 'category-badge';
    badge.textContent = expense.category;
    badge.style.backgroundColor = CATEGORIES[expense.category].color;

    const amountEl = document.createElement('span');
    amountEl.className = 'expense-amount';
    amountEl.textContent = formatCurrency(expense.amount);

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'delete-btn';
    delBtn.textContent = '✕';
    delBtn.setAttribute('aria-label', 'Delete expense: ' + expense.name);
    delBtn.dataset.id = expense.id;

    li.append(nameEl, badge, amountEl, delBtn);
    return li;
  }

  /**
   * Re-render the full expense list from state.expenses.
   * Shows placeholder when list is empty.
   * Attaches delete event delegation once via listListenerAttached flag.
   */
  function renderExpenseList() {
    const list = document.getElementById('expense-list');
    list.innerHTML = '';

    // Attach click delegation once
    if (!listListenerAttached) {
      list.addEventListener('click', function (e) {
        if (e.target.classList.contains('delete-btn')) {
          handleDeleteExpense(e);
        }
      });
      listListenerAttached = true;
    }

    if (state.expenses.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'empty-state';
      empty.textContent = 'NO EXPENSES RECORDED YET';
      list.appendChild(empty);
      return;
    }

    state.expenses.forEach(function (expense) {
      list.appendChild(buildExpenseRow(expense));
    });
  }

  /**
   * Draw centered white text on the canvas.
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} text
   * @param {number} cx - Center x coordinate
   * @param {number} cy - Center y coordinate
   */
  function drawCenteredText(ctx, text, cx, cy) {
    ctx.save();
    ctx.fillStyle    = '#ffffff';
    ctx.font         = '700 14px "BMW Type Next Latin", Inter, system-ui, sans-serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, cy);
    ctx.restore();
  }

  /**
   * Render the chart legend list from active categories.
   * @param {{ category: string, amount: number }[]} activeCategories
   */
  function renderLegend(activeCategories) {
    const legend = document.getElementById('chart-legend');
    legend.innerHTML = '';

    activeCategories.forEach(function ({ category, amount }) {
      const li = document.createElement('li');

      const swatch = document.createElement('span');
      swatch.className = 'legend-swatch';
      swatch.style.backgroundColor = CATEGORIES[category].color;

      const label = document.createElement('span');
      label.className = 'legend-label';
      label.textContent = category;

      const amountEl = document.createElement('span');
      amountEl.className = 'legend-amount';
      amountEl.textContent = formatCurrency(amount);

      li.appendChild(swatch);
      li.appendChild(label);
      li.appendChild(amountEl);
      legend.appendChild(li);
    });
  }

  /**
   * Re-render the doughnut chart and legend from state.expenses.
   * Aggregates per-category totals, draws arc segments, updates aria-label.
   * Shows "NO DATA" centered text when there are no expenses.
   */
  function renderChart() {
    const canvas = document.getElementById('expense-chart');
    const ctx = canvasCtx;
    if (!ctx) return;

    const size = 300;
    const CX = size / 2;         // 150
    const CY = size / 2;         // 150
    const OUTER_R = Math.min(CX, CY) * 0.85;  // ~127.5
    const INNER_R = OUTER_R * 0.55;            // ~70
    const GAP = 0.02;

    ctx.clearRect(0, 0, size, size);

    // 1. Aggregate per-category totals
    const totals = {};
    Object.keys(CATEGORIES).forEach(function (cat) { totals[cat] = 0; });
    state.expenses.forEach(function (e) { totals[e.category] += e.amount; });

    const activeCategories = Object.keys(totals)
      .filter(function (cat) { return totals[cat] > 0; })
      .map(function (cat) { return { category: cat, amount: totals[cat] }; });

    // 2. Empty state
    if (activeCategories.length === 0) {
      drawCenteredText(ctx, 'NO DATA', CX, CY);
      renderLegend([]);
      canvas.setAttribute('aria-label', 'Expense breakdown: no data');
      return;
    }

    // 3. Grand total
    const grandTotal = activeCategories.reduce(function (s, c) { return s + c.amount; }, 0);

    // 4. Draw arc segments
    let startAngle = -Math.PI / 2;
    activeCategories.forEach(function ({ category, amount }) {
      const sliceAngle = (amount / grandTotal) * 2 * Math.PI - GAP;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.arc(CX, CY, OUTER_R, startAngle + GAP / 2, endAngle);
      ctx.arc(CX, CY, INNER_R, endAngle, startAngle + GAP / 2, true);
      ctx.closePath();
      ctx.fillStyle = CATEGORIES[category].color;
      ctx.fill();

      startAngle = endAngle + GAP;
    });

    // 5. Center text
    drawCenteredText(ctx, formatCurrency(grandTotal), CX, CY);

    // 6. Legend
    renderLegend(activeCategories);

    // 7. aria-label
    const parts = activeCategories.map(function (c) {
      return c.category + ' ' + formatCurrency(c.amount);
    });
    canvas.setAttribute('aria-label', 'Expense breakdown by category: ' + parts.join(', '));
  }

  /**
   * Initialise the canvas element for high-DPI (Retina) displays.
   * Scales the backing store by devicePixelRatio so drawing commands
   * use logical pixels, then stores the context in canvasCtx.
   * @param {HTMLCanvasElement} canvas
   * @returns {CanvasRenderingContext2D}
   */
  function initCanvas(canvas) {
    const dpr  = window.devicePixelRatio || 1;
    const size = 300;
    canvas.width        = size * dpr;
    canvas.height       = size * dpr;
    canvas.style.width  = size + 'px';
    canvas.style.height = size + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    canvasCtx = ctx;
    return ctx;
  }

  // ─── 7. EVENT HANDLERS ─────────────────────────────────────────

  /**
   * Show the LocalStorage unavailability warning banner.
   * Guards against showing it more than once per session.
   */
  function showStorageBanner() {
    if (bannerShown) return;
    bannerShown = true;
    const banner = document.getElementById('storage-banner');
    if (!banner) return;
    banner.removeAttribute('hidden');
    const dismissBtn = document.getElementById('dismiss-banner');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', function () {
        banner.setAttribute('hidden', '');
      }, { once: true });
    }
  }

  /**
   * Display an inline field error message.
   * @param {string} id  - The element ID of the error <span>
   * @param {string} msg - The error message to display
   */
  function showFieldError(id, msg) {
    document.getElementById(id).textContent = msg;
  }

  /**
   * Clear an inline field error message.
   * @param {string} id - The element ID of the error <span>
   */
  function clearFieldError(id) {
    document.getElementById(id).textContent = '';
  }

  /**
   * Handle balance form submission.
   * Validates input, updates state, persists, and re-renders on success.
   * @param {SubmitEvent} e
   */
  function handleSetBalance(e) {
    e.preventDefault();
    const raw = document.getElementById('balance-input').value;
    const result = validateBalance(raw);
    if (!result.valid) {
      showFieldError('balance-error', result.error);
      return;
    }
    state.balance = result.value;
    persistState();
    renderBalanceDisplay();
    document.getElementById('balance-input').value = '';
    clearFieldError('balance-error');
  }

  /**
   * Handle expense form submission.
   * Validates input, builds expense object, prepends to state, and re-renders.
   * @param {SubmitEvent} e
   */
  function handleAddExpense(e) {
    e.preventDefault();

    const name      = document.getElementById('expense-name').value;
    const rawAmount = document.getElementById('expense-amount').value;
    const category  = document.getElementById('expense-category').value;

    const { valid, errors } = validateExpense(name, rawAmount, category);

    if (!valid) {
      showFieldError('name-error',   errors.name   || '');
      showFieldError('amount-error', errors.amount || '');
      return;
    }

    clearFieldError('name-error');
    clearFieldError('amount-error');

    const expense = {
      id:        generateId(),
      name:      name.trim(),
      amount:    parseFloat(rawAmount),
      category,
      timestamp: Date.now(),
    };

    state.expenses.unshift(expense);
    persistState();
    renderBalanceDisplay();
    renderExpenseList();
    renderChart();

    // Reset form fields
    document.getElementById('expense-name').value   = '';
    document.getElementById('expense-amount').value = '';
    handleCategoryTab('Food');
  }

  /**
   * Handle category tab button click.
   * Updates the hidden input value and toggles the active tab class.
   * @param {string} category
   */
  function handleCategoryTab(category) {
    document.getElementById('expense-category').value = category;

    document.querySelectorAll('.category-tab').forEach(function (btn) {
      btn.classList.remove('category-tab--active');
    });

    const activeBtn = document.querySelector(`.category-tab[data-category="${category}"]`);
    if (activeBtn) {
      activeBtn.classList.add('category-tab--active');
    }
  }

  /**
   * Handle delete button click (event delegation on #expense-list).
   * Uses closest() to find the delete button regardless of click target.
   * @param {MouseEvent} e
   */
  function handleDeleteExpense(e) {
    const btn = e.target.closest('.delete-btn');
    if (!btn) return;

    const id = btn.getAttribute('data-id');
    state.expenses = state.expenses.filter(exp => exp.id !== id);

    persistState();
    renderBalanceDisplay();
    renderExpenseList();
    renderChart();
  }

  // ─── 8. INIT ───────────────────────────────────────────────────

  /**
   * Entry point. Called on DOMContentLoaded.
   * Order: checkStorage → loadState → renderAll → attachListeners
   */
  function init() {
    storageAvailable = checkStorageAvailable();
    if (!storageAvailable) {
      showStorageBanner();
    }
    loadState();
    renderBalanceDisplay();
    renderCategoryTabs();
    renderExpenseList();
    initCanvas(document.getElementById('expense-chart'));
    renderChart();
    document.getElementById('balance-form').addEventListener('submit', handleSetBalance);
    document.getElementById('expense-form').addEventListener('submit', handleAddExpense);
  }

  document.addEventListener('DOMContentLoaded', init);

})();
