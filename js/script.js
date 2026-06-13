(function () {
  'use strict';

  /* ─── CONSTANTS ────────────────────────────────────────────── */
  const LS_BALANCE  = 'em_balance';
  const LS_EXPENSES = 'em_expenses';
  const LS_CATS     = 'em_categories';
  const LS_LIMIT    = 'em_limit';
  const LS_THEME    = 'em_theme';

  const MAX_BALANCE = 999_999_999;
  const MAX_AMOUNT  = 999_999_999.99;
  const MAX_NAME    = 250;
  const LOCALE      = 'id-ID';
  const CURRENCY    = 'IDR';

  /* ─── DEFAULT CATEGORIES ───────────────────────────────────── */
  const DEFAULT_CATS = {
    Food:          '#0066b1',
    Transport:     '#1c69d4',
    Entertainment: '#e22718',
    Shopping:      '#f4b400',
    Health:        '#0fa336',
    Other:         '#7e7e7e',
  };

  /* ─── STATE ────────────────────────────────────────────────── */
  let state = {
    balance:    0,
    expenses:   [],
    categories: { ...DEFAULT_CATS },  // name → hex
    limit:      0,                    // 0 = no limit
  };

  let storageOk  = true;
  let canvasCtx  = null;
  let activeView = 'dashboard';
  let sortField  = 'amount';
  let sortDir    = 'desc';
  let monthCursor = new Date(); // used for monthly view
  let selectedCategory = '';

  /* ─── STORAGE ──────────────────────────────────────────────── */
  function checkStorage() {
    try {
      localStorage.setItem('__t__','1');
      localStorage.removeItem('__t__');
      return true;
    } catch { return false; }
  }

  function persist() {
    if (!storageOk) return;
    localStorage.setItem(LS_BALANCE,  String(state.balance));
    localStorage.setItem(LS_EXPENSES, JSON.stringify(state.expenses));
    localStorage.setItem(LS_CATS,     JSON.stringify(state.categories));
    localStorage.setItem(LS_LIMIT,    String(state.limit));
  }

  function load() {
    const rb = localStorage.getItem(LS_BALANCE);
    state.balance = rb !== null && !isNaN(+rb) ? +rb : 0;

    try {
      const re = localStorage.getItem(LS_EXPENSES);
      const p  = re ? JSON.parse(re) : [];
      state.expenses = Array.isArray(p) ? p : [];
    } catch { state.expenses = []; }

    try {
      const rc = localStorage.getItem(LS_CATS);
      const p  = rc ? JSON.parse(rc) : null;
      state.categories = (p && typeof p === 'object') ? { ...DEFAULT_CATS, ...p } : { ...DEFAULT_CATS };
    } catch { state.categories = { ...DEFAULT_CATS }; }

    const rl = localStorage.getItem(LS_LIMIT);
    state.limit = rl !== null && !isNaN(+rl) ? +rl : 0;
  }

  /* ─── FORMAT ───────────────────────────────────────────────── */
  function fmt(v) {
    return new Intl.NumberFormat(LOCALE, {
      style: 'currency', currency: CURRENCY,
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(v);
  }

  function fmtDate(ts) {
    return new Date(ts).toLocaleDateString(LOCALE, {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  function truncate(s, n) {
    return s.length > n ? s.slice(0, n) + '…' : s;
  }

  function uid() {
    return crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  /* ─── THEME ────────────────────────────────────────────────── */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.getElementById('theme-label').textContent = theme === 'dark' ? 'LIGHT' : 'DARK';
    document.getElementById('theme-icon-sun').style.display  = theme === 'dark' ? 'none'  : '';
    document.getElementById('theme-icon-moon').style.display = theme === 'dark' ? ''      : 'none';
    if (storageOk) localStorage.setItem(LS_THEME, theme);
    // Redraw chart for new colors
    renderChart();
  }

  /* ─── VIEWS ────────────────────────────────────────────────── */
  function showView(v) {
    activeView = v;
    ['dashboard','history','monthly','settings'].forEach(id => {
      const el = document.getElementById('view-' + id);
      if (el) el.hidden = (id !== v);
    });
    document.querySelectorAll('.view-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === v);
    });
    if (v === 'monthly')  renderMonthly();
    if (v === 'history')  renderHistory();
    if (v === 'settings') renderSettings();
  }

  /* ─── VALIDATION ───────────────────────────────────────────── */
  function validateBalance(raw) {
    const t = (raw ?? '').trim();
    if (!t) return { ok: false, err: 'Enter a valid number' };
    const v = parseFloat(t);
    if (isNaN(v) || v <= 0 || v > MAX_BALANCE)
      return { ok: false, err: 'Balance must be between 1 and 999,999,999' };
    return { ok: true, val: v };
  }

  function validateExpense(name, rawAmt, cat) {
    const errs = {};
    const n = (name ?? '').trim();
    if (!n)               errs.name   = 'Item name is required';
    else if (n.length > MAX_NAME) errs.name = 'Max 250 characters';

    const a = parseFloat((rawAmt ?? '').trim());
    if (!rawAmt.trim())           errs.amount = 'Enter a valid amount';
    else if (isNaN(a) || a <= 0 || a > MAX_AMOUNT) errs.amount = 'Enter a valid amount';

    if (!cat) errs.cat = 'Select a category';
    return { ok: Object.keys(errs).length === 0, errs };
  }

  /* ─── BALANCE ──────────────────────────────────────────────── */
  function remaining() {
    return state.expenses.reduce((s, e) => s - e.amount, state.balance);
  }

  function renderBalance() {
    const rem  = remaining();
    const disp = document.getElementById('balance-display');
    const meta = document.getElementById('balance-meta');
    disp.textContent = fmt(rem);
    disp.classList.toggle('negative', rem < 0);
    const spent = state.expenses.reduce((s, e) => s + e.amount, 0);
    meta.textContent = state.balance > 0
      ? `of ${fmt(state.balance)} · spent ${fmt(spent)}` : '';

    // Limit bar
    const wrap = document.getElementById('limit-bar-wrap');
    if (state.limit > 0 && spent > 0) {
      wrap.hidden = false;
      const pct = Math.min(100, (spent / state.limit) * 100);
      const fill = document.getElementById('limit-bar-fill');
      fill.style.width = pct.toFixed(1) + '%';
      fill.classList.toggle('over', pct >= 100);
      document.getElementById('limit-pct-label').textContent = pct.toFixed(0) + '%';
    } else {
      wrap.hidden = true;
    }
  }

  /* ─── CATEGORY TABS ────────────────────────────────────────── */
  function renderCategoryTabs() {
    const container = document.getElementById('category-tabs');
    container.innerHTML = '';

    const cats = Object.keys(state.categories);
    if (!cats.includes(selectedCategory)) {
      selectedCategory = cats[0] || '';
      document.getElementById('expense-category').value = selectedCategory;
    }

    cats.forEach(cat => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cat-tab' + (cat === selectedCategory ? ' cat-tab--active' : '');
      btn.textContent = cat;
      btn.dataset.category = cat;
      btn.addEventListener('click', () => selectCategory(cat));
      container.appendChild(btn);
    });

    // "+ Custom" button
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'cat-tab cat-tab--add';
    addBtn.textContent = '+ NEW';
    addBtn.addEventListener('click', openCategoryModal);
    container.appendChild(addBtn);
  }

  function selectCategory(cat) {
    selectedCategory = cat;
    document.getElementById('expense-category').value = cat;
    document.querySelectorAll('.cat-tab').forEach(btn => {
      btn.classList.toggle('cat-tab--active', btn.dataset.category === cat);
    });
  }

  /* ─── CATEGORY MODAL ───────────────────────────────────────── */
  function openCategoryModal() {
    document.getElementById('modal-cat-name').value  = '';
    document.getElementById('modal-cat-color').value = '#0066b1';
    document.getElementById('modal-cat-error').textContent = '';
    document.getElementById('modal-cat').hidden = false;
    document.getElementById('modal-cat-name').focus();
  }

  function closeCategoryModal() {
    document.getElementById('modal-cat').hidden = true;
  }

  function saveCategoryFromModal() {
    const name  = document.getElementById('modal-cat-name').value.trim();
    const color = document.getElementById('modal-cat-color').value;
    const errEl = document.getElementById('modal-cat-error');

    if (!name) { errEl.textContent = 'Category name is required'; return; }
    if (state.categories[name]) { errEl.textContent = 'Category already exists'; return; }

    state.categories[name] = color;
    persist();
    closeCategoryModal();
    renderCategoryTabs();
    selectCategory(name);
    if (activeView === 'settings') renderSettings();
  }

  /* ─── HISTORY RENDER ───────────────────────────────────────── */
  function getSortedExpenses() {
    const copy = [...state.expenses];
    copy.sort((a, b) => {
      let av, bv;
      if (sortField === 'amount')   { av = a.amount;    bv = b.amount; }
      else if (sortField === 'date') { av = a.timestamp; bv = b.timestamp; }
      else { av = a.category; bv = b.category; }
      if (typeof av === 'string') return sortDir === 'asc'
        ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return copy;
  }

  function renderHistory() {
    const tbody  = document.getElementById('expense-tbody');
    const empty  = document.getElementById('history-empty');
    const wrap   = tbody.closest('.expense-scroll-wrap');
    tbody.innerHTML = '';

    const sorted = getSortedExpenses();

    if (sorted.length === 0) {
      wrap.hidden  = true;
      empty.hidden = false;
      return;
    }
    wrap.hidden  = false;
    empty.hidden = true;

    sorted.forEach(exp => {
      const isOver = state.limit > 0 && exp.amount > state.limit;
      const tr = document.createElement('tr');
      if (isOver) tr.classList.add('over-limit');

      const color = state.categories[exp.category] || '#7e7e7e';

      tr.innerHTML = `
        <td class="name-cell">
          ${truncate(exp.name, 32)}
          ${isOver ? '<span class="over-limit-badge">OVER LIMIT</span>' : ''}
        </td>
        <td><span class="cat-badge" style="background:${color}">${exp.category}</span></td>
        <td class="date-cell">${fmtDate(exp.timestamp)}</td>
        <td class="amount-cell ${isOver ? 'over-limit-amount' : ''}">${fmt(exp.amount)}</td>
        <td class="del-cell">
          <button class="btn btn--ghost btn--sm btn--danger delete-btn"
                  aria-label="Delete ${exp.name}" data-id="${exp.id}">✕</button>
        </td>`;
      tbody.appendChild(tr);
    });
  }

  function renderAllExpenseViews() {
    renderBalance();
    renderChart();
    if (activeView === 'history')  renderHistory();
    if (activeView === 'monthly')  renderMonthly();
  }

  /* ─── CHART ────────────────────────────────────────────────── */
  function initCanvas() {
    const canvas = document.getElementById('expense-chart');
    const dpr    = window.devicePixelRatio || 1;
    const size   = 200;
    canvas.width        = size * dpr;
    canvas.height       = size * dpr;
    canvas.style.width  = size + 'px';
    canvas.style.height = size + 'px';
    canvasCtx = canvas.getContext('2d');
    canvasCtx.scale(dpr, dpr);
  }

  function renderChart() {
    const ctx = canvasCtx;
    if (!ctx) return;
    const size = 200, cx = 100, cy = 100;
    const OR = 82, IR = 48, GAP = 0.025;
    ctx.clearRect(0, 0, size, size);

    const totals = {};
    Object.keys(state.categories).forEach(c => { totals[c] = 0; });
    state.expenses.forEach(e => { if (totals[e.category] !== undefined) totals[e.category] += e.amount; });

    const active = Object.keys(totals)
      .filter(c => totals[c] > 0)
      .map(c => ({ c, v: totals[c] }));

    const legend = document.getElementById('chart-legend');
    legend.innerHTML = '';

    if (!active.length) {
      ctx.fillStyle = getComputedStyle(document.documentElement)
                       .getPropertyValue('--muted').trim() || '#7e7e7e';
      ctx.font = '700 13px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('NO DATA', cx, cy);
      return;
    }

    const total = active.reduce((s, x) => s + x.v, 0);
    let start   = -Math.PI / 2;
    active.forEach(({ c, v }) => {
      const sweep = (v / total) * Math.PI * 2 - GAP;
      ctx.beginPath();
      ctx.arc(cx, cy, OR, start + GAP / 2, start + sweep);
      ctx.arc(cx, cy, IR, start + sweep, start + GAP / 2, true);
      ctx.closePath();
      ctx.fillStyle = state.categories[c] || '#7e7e7e';
      ctx.fill();
      start += sweep + GAP;
    });

    // Center total
    const textColor = getComputedStyle(document.documentElement)
                       .getPropertyValue('--on-dark').trim() || '#fff';
    ctx.fillStyle = textColor;
    ctx.font = '700 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(fmt(total), cx, cy);

    active.forEach(({ c, v }) => {
      const li   = document.createElement('li');
      const sw   = document.createElement('span');
      sw.className = 'legend-swatch';
      sw.style.background = state.categories[c] || '#7e7e7e';
      const lbl  = document.createElement('span');
      lbl.className = 'legend-label';
      lbl.textContent = c;
      const amt  = document.createElement('span');
      amt.className = 'legend-amount';
      amt.textContent = fmt(v);
      li.append(sw, lbl, amt);
      legend.appendChild(li);
    });
  }

  /* ─── MONTHLY SUMMARY ──────────────────────────────────────── */
  function renderMonthly() {
    const y = monthCursor.getFullYear();
    const m = monthCursor.getMonth();

    document.getElementById('month-title').textContent =
      new Date(y, m, 1).toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' })
        .toUpperCase();

    const exps = state.expenses.filter(e => {
      const d = new Date(e.timestamp);
      return d.getFullYear() === y && d.getMonth() === m;
    });

    const total = exps.reduce((s, e) => s + e.amount, 0);
    const count = exps.length;
    const avg   = count > 0 ? total / count : 0;

    // Top category
    const catTotals = {};
    exps.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });
    const topCat = Object.keys(catTotals).sort((a,b) => catTotals[b] - catTotals[a])[0] || '—';

    document.getElementById('mstat-total').textContent = fmt(total);
    document.getElementById('mstat-count').textContent = count;
    document.getElementById('mstat-avg').textContent   = fmt(avg);
    document.getElementById('mstat-top').textContent   = topCat;

    const list  = document.getElementById('monthly-cat-list');
    const empty = document.getElementById('monthly-empty');
    list.innerHTML = '';

    if (!exps.length) {
      list.hidden  = true;
      empty.hidden = false;
      return;
    }
    list.hidden  = false;
    empty.hidden = true;

    const maxCat = Math.max(...Object.values(catTotals));
    Object.keys(catTotals)
      .sort((a,b) => catTotals[b] - catTotals[a])
      .forEach(cat => {
        const li   = document.createElement('li');
        const pct  = maxCat > 0 ? (catTotals[cat] / maxCat * 100).toFixed(1) : 0;
        const clr  = state.categories[cat] || '#7e7e7e';
        li.innerHTML = `
          <span class="monthly-cat-name">${cat}</span>
          <div class="cat-bar-bg">
            <div class="cat-bar-fill" style="width:${pct}%;background:${clr}"></div>
          </div>
          <span class="monthly-cat-amt">${fmt(catTotals[cat])}</span>`;
        list.appendChild(li);
      });
  }

  /* ─── SETTINGS RENDER ──────────────────────────────────────── */
  function renderSettings() {
    const li = document.getElementById('limit-input');
    if (state.limit > 0) li.value = state.limit;
    const st = document.getElementById('limit-status');
    st.textContent = state.limit > 0
      ? `Active: transactions above ${fmt(state.limit)} are highlighted`
      : 'No spend limit set';

    const list = document.getElementById('custom-cats-list');
    list.innerHTML = '';
    Object.entries(state.categories).forEach(([name, color]) => {
      const chip = document.createElement('div');
      chip.className = 'custom-cat-chip';
      chip.innerHTML = `
        <span class="chip-swatch" style="background:${color}"></span>
        ${name}
        <button class="chip-del" aria-label="Remove ${name}" data-cat="${name}">✕</button>`;
      list.appendChild(chip);
    });
  }

  /* ─── EVENT HANDLERS ───────────────────────────────────────── */
  function handleSetBalance(e) {
    e.preventDefault();
    const raw = document.getElementById('balance-input').value;
    const r   = validateBalance(raw);
    if (!r.ok) {
      document.getElementById('balance-error').textContent = r.err;
      return;
    }
    state.balance = r.val;
    persist();
    renderBalance();
    document.getElementById('balance-input').value = '';
    document.getElementById('balance-error').textContent = '';
  }

  function handleAddExpense(e) {
    e.preventDefault();
    const name    = document.getElementById('expense-name').value;
    const rawAmt  = document.getElementById('expense-amount').value;
    const cat     = document.getElementById('expense-category').value;
    const { ok, errs } = validateExpense(name, rawAmt, cat);

    document.getElementById('name-error').textContent   = errs.name   || '';
    document.getElementById('amount-error').textContent = errs.amount || '';
    if (!ok) return;

    state.expenses.unshift({
      id:        uid(),
      name:      name.trim(),
      amount:    parseFloat(rawAmt),
      category:  cat,
      timestamp: Date.now(),
    });
    persist();
    renderAllExpenseViews();
    document.getElementById('expense-name').value   = '';
    document.getElementById('expense-amount').value = '';
  }

  function handleDeleteExpense(e) {
    const btn = e.target.closest('.delete-btn');
    if (!btn) return;
    state.expenses = state.expenses.filter(x => x.id !== btn.dataset.id);
    persist();
    renderAllExpenseViews();
  }

  function handleSortClick(e) {
    const btn = e.target.closest('.sort-btn');
    if (!btn) return;
    const field = btn.dataset.sort;
    if (sortField === field) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortField = field;
      sortDir   = field === 'category' ? 'asc' : 'desc';
    }
    document.querySelectorAll('.sort-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.sort === sortField);
      if (b.dataset.sort === sortField) {
        b.classList.toggle('desc', sortDir === 'desc');
      } else {
        b.classList.remove('desc');
      }
    });
    renderHistory();
  }

  /* ─── INIT ─────────────────────────────────────────────────── */
  function init() {
    storageOk = checkStorage();
    if (!storageOk) {
      document.getElementById('storage-banner').hidden = false;
    }

    // Theme
    const savedTheme = storageOk ? (localStorage.getItem(LS_THEME) || 'dark') : 'dark';
    applyTheme(savedTheme);

    load();
    renderBalance();
    renderCategoryTabs();
    initCanvas();
    renderChart();

    // Month cursor = now
    monthCursor = new Date();

    /* ── Form events ── */
    document.getElementById('balance-form')
      .addEventListener('submit', handleSetBalance);
    document.getElementById('expense-form')
      .addEventListener('submit', handleAddExpense);

    /* ── Delete delegation (history table) ── */
    document.getElementById('expense-tbody')
      .addEventListener('click', handleDeleteExpense);

    /* ── View tabs ── */
    document.querySelectorAll('.view-tab').forEach(btn => {
      btn.addEventListener('click', () => showView(btn.dataset.view));
    });

    /* ── Sort bar ── */
    document.querySelector('.sort-bar')
      .addEventListener('click', handleSortClick);

    /* ── Monthly nav ── */
    document.getElementById('month-prev').addEventListener('click', () => {
      monthCursor.setMonth(monthCursor.getMonth() - 1);
      renderMonthly();
    });
    document.getElementById('month-next').addEventListener('click', () => {
      monthCursor.setMonth(monthCursor.getMonth() + 1);
      renderMonthly();
    });

    /* ── Theme toggle ── */
    document.getElementById('theme-toggle').addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme');
      applyTheme(cur === 'dark' ? 'light' : 'dark');
    });

    /* ── Category modal ── */
    document.getElementById('modal-cat-cancel').addEventListener('click', closeCategoryModal);
    document.getElementById('modal-cat-save').addEventListener('click', saveCategoryFromModal);
    document.getElementById('modal-cat').addEventListener('click', e => {
      if (e.target === e.currentTarget) closeCategoryModal();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeCategoryModal();
    });

    /* ── Settings: limit ── */
    document.getElementById('save-limit-btn').addEventListener('click', () => {
      const v = parseFloat(document.getElementById('limit-input').value);
      if (isNaN(v) || v < 0) return;
      state.limit = v;
      persist();
      renderSettings();
      renderBalance();
      if (activeView === 'history') renderHistory();
    });
    document.getElementById('clear-limit-btn').addEventListener('click', () => {
      state.limit = 0;
      document.getElementById('limit-input').value = '';
      persist();
      renderSettings();
      renderBalance();
      if (activeView === 'history') renderHistory();
    });

    /* ── Settings: category management ── */
    document.getElementById('add-cat-btn').addEventListener('click', () => {
      const name  = document.getElementById('new-cat-name').value.trim();
      const color = document.getElementById('new-cat-color').value;
      const errEl = document.getElementById('cat-error');
      if (!name) { errEl.textContent = 'Name required'; return; }
      if (state.categories[name]) { errEl.textContent = 'Already exists'; return; }
      state.categories[name] = color;
      persist();
      renderSettings();
      renderCategoryTabs();
      document.getElementById('new-cat-name').value = '';
      errEl.textContent = '';
    });

    document.getElementById('custom-cats-list').addEventListener('click', e => {
      const btn = e.target.closest('.chip-del');
      if (!btn) return;
      const cat = btn.dataset.cat;
      delete state.categories[cat];
      // Remap expenses with deleted category to 'Other' (or first available)
      const fallback = Object.keys(state.categories)[0] || 'Other';
      state.expenses.forEach(exp => {
        if (exp.category === cat) exp.category = fallback;
      });
      persist();
      renderSettings();
      renderCategoryTabs();
      renderAllExpenseViews();
    });

    /* ── Storage banner dismiss ── */
    document.getElementById('dismiss-banner').addEventListener('click', () => {
      document.getElementById('storage-banner').hidden = true;
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();