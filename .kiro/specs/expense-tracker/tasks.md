# Implementation Plan: Expense Tracker

## Overview

Build a zero-dependency, single-page expense tracker using HTML, CSS, and Vanilla JavaScript. All logic lives in one IIFE inside `js/script.js`; styling follows the BMW M design language in `css/style.css`; markup is defined in `index.html`. State is persisted to `localStorage`. A Canvas doughnut chart visualises spend by category.

## Tasks

- [x] 1. Create `index.html` — full semantic markup and scaffold
  - Create `index.html` at the project root with `<!DOCTYPE html>`, `<html lang="en">`, `<head>` (charset, viewport, title, stylesheet link), and `<body>`.
  - Add the storage warning banner `<div id="storage-banner" role="alert" hidden>` with dismiss button.
  - Add `<header id="app-header">` containing `.m-tricolor` (three `<span>` bars, `aria-hidden="true"`) and `<h1>EXPENSE TRACKER</h1>`.
  - Add `<main>` with four `<section>` children: `#balance-section`, `#form-section`, `#list-section`, `#chart-section`; each with an `aria-labelledby` heading.
  - Inside `#balance-section`: balance display `<p id="balance-display" aria-live="polite">`, balance form with `<label for="balance-input">`, numeric input, error span (`role="alert" aria-live="assertive"`), and submit button.
  - Inside `#form-section`: expense form with labelled inputs for item name (`maxlength="250"`), amount, a `<div id="category-tabs" role="group" aria-labelledby="category-label">` (populated by JS), a hidden category input, and submit button.
  - Inside `#list-section`: `<ul id="expense-list" aria-label="Expense history">`.
  - Inside `#chart-section`: `<canvas id="expense-chart" width="300" height="300" aria-label="Expense breakdown by category">` and `<ul id="chart-legend" aria-label="Chart legend">`.
  - Add `<script src="js/script.js"></script>` just before `</body>`.
  - _Requirements: 1.1, 2.1, 2.2, 3.1, 4.1, 5.1, 6.1, 8.1, 8.3_

- [x] 2. Implement CSS design tokens and global styles
  - [x] 2.1 Define CSS custom properties (design tokens) and base reset
    - Add `:root` block with all color, typography, spacing, and border tokens from the design (`--color-bg`, `--color-surface`, `--color-border`, `--color-text-primary`, `--color-text-muted`, `--color-m-blue`, `--color-m-darkblue`, `--color-m-red`, `--color-negative`, `--font-family`, `--font-weight-bold`, `--font-weight-light`, `--letter-spacing-ui`, spacing scale, `--border-radius: 0`).
    - Add box-sizing reset, `margin: 0`, `padding: 0`, and `background: var(--color-bg); color: var(--color-text-primary)` on `body`.
    - Set `font-family`, `font-weight: var(--font-weight-light)` on `body`.
    - _Requirements: 1.2, 1.3_

  - [x] 2.2 Style the header and M tricolor accent bars
    - Make `<header>` sticky (`position: sticky; top: 0; z-index: 100`).
    - Style `.m-tricolor` as a flex row; each `.bar` is `4px` tall, `flex: 1`, zero border-radius; `.bar--blue` `#0066b1`, `.bar--darkblue` `#1c69d4`, `.bar--red` `#e22718`.
    - Style `h1` with `font-weight: 700`, uppercase, `letter-spacing: 0.1em`.
    - _Requirements: 1.5, 2.1, 2.2, 2.3_

  - [x] 2.3 Style the layout, sections, and responsive behavior
    - Set `<main>` to `max-width: 680px; margin: 0 auto; padding: var(--space-lg)`.
    - Style each `<section>` with `background: var(--color-surface); border: 1px solid var(--color-border); padding: var(--space-lg); margin-bottom: var(--space-md)`.
    - Ensure single-column stacking at all widths from 320 px to 1440 px; add `@media (max-width: 767px)` breakpoint if needed.
    - _Requirements: 1.4_

  - [x] 2.4 Style form inputs, buttons, and focus indicators
    - Style all `<input>` and `<button>` elements: `border-radius: 0`, `border: 1px solid var(--color-border)`, `background: var(--color-bg)`, `color: var(--color-text-primary)`, full-width inputs.
    - Style `.submit-btn` and `#balance-form button` with `background: var(--color-m-blue)`, `color: #fff`, `font-weight: 700`, `letter-spacing: var(--letter-spacing-ui)`, uppercase text.
    - Add `:focus-visible` rule: `outline: 2px solid var(--color-m-darkblue); outline-offset: 2px` (contrast ≥ 3:1 against `#000`).
    - Style `.field-error` spans: `color: var(--color-m-red); font-size: 0.85rem`.
    - _Requirements: 1.2, 1.5, 8.2, 8.6_

  - [x] 2.5 Style category tab buttons
    - Style `.category-tab` buttons inside `#category-tabs`: `background: var(--color-surface)`, `border: 1px solid var(--color-border)`, uppercase, `letter-spacing: var(--letter-spacing-ui)`, `font-weight: 300`, `border-radius: 0`, `padding: var(--space-sm) var(--space-md)`.
    - Active tab (`.category-tab--active`): `background: var(--color-m-blue); color: #fff; border-color: var(--color-m-blue)`.
    - Wrap tabs via `flex-wrap: wrap` in `#category-tabs`.
    - _Requirements: 1.5, 4.6_

  - [ ] 2.6 Style the expense list rows, category badges, and empty state
    - Style `#expense-list li` as a CSS grid row: `grid-template-columns: 1fr auto auto auto`; align items center; `border-bottom: 1px solid var(--color-border)`.
    - Style `.category-badge`: uppercase, small font, `padding: 2px 6px`, `color: #fff`, `border-radius: 0`.
    - Style `.delete-btn`: minimal, icon-like, `background: transparent; color: var(--color-text-muted); border: none`.
    - Style `.empty-state`: `color: var(--color-text-muted); font-weight: 300; text-align: center; padding: var(--space-xl)`.
    - _Requirements: 5.1, 5.4, 5.6_

  - [x] 2.7 Style the balance display and chart/legend section
    - Style `#balance-display`: large font size (`2rem`), `font-weight: 700`.
    - Add `.balance--negative` rule: `color: var(--color-negative)`.
    - Style `#chart-section` inner layout: responsive flex row (chart + legend side-by-side ≥ 480 px, stacked below).
    - Style `#chart-legend li` items: flex row, color swatch (`12px` square, `border-radius: 0`), label, amount.
    - _Requirements: 3.5, 6.3_

  - [x] 2.8 Style the storage warning banner
    - Style `#storage-banner`: `background: var(--color-m-red)`, `color: #fff`, `padding: var(--space-sm) var(--space-md)`, full-width, uppercase.
    - Style `#dismiss-banner`: float right or flexed end, transparent background, `color: #fff`.
    - _Requirements: 7.3_

- [x] 3. Implement `js/script.js` — constants, state, and LocalStorage helpers
  - [x] 3.1 Write the IIFE scaffold, constants, and initial state
    - Wrap everything in `(function () { ... })();`.
    - Declare all constants: `LS_KEY_BALANCE`, `LS_KEY_EXPENSES`, `DEFAULT_LOCALE`, `DEFAULT_CURRENCY`, `MAX_BALANCE`, `MAX_AMOUNT`, `MAX_NAME_LEN`, `LIST_TRUNCATE`.
    - Declare `CATEGORIES` object with all six entries and their hex colors.
    - Declare `let state = { balance: 0, expenses: [] }` and `let storageAvailable = true`.
    - _Requirements: 1.6, 4.7, 5.6, 7.1_

  - [x] 3.2 Implement `checkStorageAvailable`, `persistState`, and `loadState`
    - `checkStorageAvailable()`: try/catch localStorage test write; return boolean.
    - `persistState()`: no-op when `storageAvailable === false`; otherwise `localStorage.setItem` for both keys (balance as string, expenses as JSON).
    - `loadState()`: read and parse balance key (default `0` on missing/invalid); read and parse expenses key — validate it is an array; on JSON parse failure or non-array, set `state.expenses = []` and call `showStorageBanner()`.
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 4. Implement formatting helpers and validation
  - [x] 4.1 Implement `formatCurrency`, `truncate`, and `generateId`
    - `formatCurrency(value)`: use `Intl.NumberFormat` with `DEFAULT_LOCALE`, `style: 'currency'`, `currency: DEFAULT_CURRENCY`, `minimumFractionDigits: 0`.
    - `truncate(str, maxLen)`: return `str.slice(0, maxLen) + '…'` if `str.length > maxLen`, else `str`.
    - `generateId()`: use `crypto.randomUUID()` with timestamp+random fallback.
    - _Requirements: 3.1, 4.7, 5.1_

  - [x] 4.2 Implement `validateBalance` and `validateExpense`
    - `validateBalance(raw)`: parse float; return `{ valid: false, error: 'Please enter a valid number' }` for `NaN`/non-numeric; `{ valid: false, error: 'Balance must be greater than zero' }` for `<= 0` or `> MAX_BALANCE`; otherwise `{ valid: true, value: parsed }`.
    - `validateExpense(name, rawAmount, category)`: check name empty → `'Item name is required'`; name > 250 → `'Item name must be 250 characters or fewer'`; amount empty/NaN/≤0/>`MAX_AMOUNT` → `'Enter a valid amount'`; return `{ valid: boolean, errors: { name?, amount? } }`.
    - _Requirements: 3.4, 4.3, 4.4_

  - [ ]* 4.3 Write property test for `validateBalance` (Property 6)
    - **Property 6: Validation Soundness**
    - **Validates: Requirements 3.4**
    - Using a property-based test library (or manual `for` loop over generated inputs), assert: `validateBalance(x).valid === true` if and only if `x` is a finite number with `x > 0 && x <= 999_999_999`; assert `valid: false` for `NaN`, `Infinity`, `0`, negative numbers, strings, `null`.

- [x] 5. Implement DOM renderers
  - [x] 5.1 Implement `renderBalanceDisplay`
    - Read `computeRemainingBalance()` (implement inline: `state.expenses.reduce((s, e) => s - e.amount, state.balance)`).
    - Set `#balance-display` `textContent` to `formatCurrency(remaining)`.
    - Toggle class `balance--negative` on the element when `remaining < 0`.
    - _Requirements: 3.1, 3.2, 3.5_

  - [ ]* 5.2 Write property test for `computeRemainingBalance` (Property 1)
    - **Property 1: Balance Conservation**
    - **Validates: Requirements 3.2, 3.5, 4.5**
    - For any array of expenses and any balance value, assert `computeRemainingBalance()` equals `state.balance - state.expenses.reduce((s, e) => s + e.amount, 0)`.
    - Test with: empty array, single expense, multiple expenses, expenses summing to exactly `state.balance`, expenses summing to more than `state.balance`.

  - [ ]* 5.3 Write property test for Negative Balance Signal (Property 5)
    - **Property 5: Negative Balance Signal**
    - **Validates: Requirements 3.5**
    - After calling `renderBalanceDisplay()` with a given state, assert that `#balance-display` carries class `balance--negative` if and only if `computeRemainingBalance() < 0`.

  - [x] 5.4 Implement `renderCategoryTabs`
    - Iterate over `Object.keys(CATEGORIES)` and create one `<button type="button" class="category-tab">` per category.
    - Set default active tab to `'Food'` (add class `category-tab--active`).
    - Attach click handler calling `handleCategoryTab(category)`.
    - _Requirements: 4.6, 4.8_

  - [x] 5.5 Implement `renderExpenseList`
    - Clear `#expense-list` (`innerHTML = ''`).
    - If `state.expenses` is empty, append a single `<li class="empty-state">NO EXPENSES RECORDED YET</li>`.
    - Otherwise iterate `state.expenses` and call `buildExpenseRow(expense)` for each, appending to the list.
    - `buildExpenseRow`: create `<li>` with name span (truncated to 40 chars), category badge (`<span>` with background from `CATEGORIES`), formatted amount span, and delete `<button>` with `aria-label="Delete expense: {name}"` and `data-id`.
    - Attach event delegation listener on `#expense-list` for delete button clicks (calls `handleDeleteExpense`).
    - _Requirements: 5.1, 5.2, 5.4, 5.6_

  - [ ]* 5.6 Write property test for Expense List Order (Property 7)
    - **Property 7: Expense List Order**
    - **Validates: Requirements 5.2**
    - For any array inserted via `addExpense()` in any order, assert `state.expenses[i].timestamp >= state.expenses[i+1].timestamp` for all valid `i`.

- [x] 6. Implement the Canvas doughnut chart renderer
  - [x] 6.1 Implement `initCanvas` with DPR scaling
    - Accept `canvas` element; read `window.devicePixelRatio || 1`.
    - Set `canvas.width = 300 * dpr`, `canvas.height = 300 * dpr`; set `canvas.style.width/height` to `'300px'`.
    - Call `ctx.scale(dpr, dpr)` once.
    - _Requirements: 6.1_

  - [x] 6.2 Implement `drawCenteredText` and `renderLegend`
    - `drawCenteredText(ctx, text, cx, cy)`: `ctx.save()`, set fill `#ffffff`, font `700 14px ...`, `textAlign: 'center'`, `textBaseline: 'middle'`, `fillText`, `ctx.restore()`.
    - `renderLegend(activeCategories)`: clear `#chart-legend`, then for each entry append a `<li>` containing a color-swatch `<span>` and label text `"{category} {formatCurrency(amount)}"`.
    - _Requirements: 6.3_

  - [x] 6.3 Implement `renderChart` (doughnut arcs, empty state, aria-label)
    - Aggregate per-category totals from `state.expenses`.
    - If no active categories: clear canvas, call `drawCenteredText(ctx, 'NO DATA', cx, cy)`, clear legend, set `aria-label` to `'Expense breakdown: no data'`, return.
    - Otherwise: compute `grandTotal`; iterate active categories; for each draw a two-arc ring segment using `ctx.arc` (outer) and `ctx.arc` (inner, counter-clockwise) with 0.02 rad gap; `ctx.fillStyle = CATEGORIES[cat].color`; `ctx.fill()`.
    - Draw `formatCurrency(grandTotal)` at center.
    - Call `renderLegend(activeCategories)`.
    - Update `canvas.setAttribute('aria-label', 'Expense breakdown by category: ' + parts.join(', '))`.
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 8.4_

  - [ ]* 6.4 Write property test for Chart Completeness (Property 4)
    - **Property 4: Chart Completeness**
    - **Validates: Requirements 6.1, 6.5**
    - After `renderChart()` with a known set of expenses, inspect `computeCategoryTotals(state.expenses)`. Assert that every category with `total > 0` is represented in the rendered legend items, and every category with `total === 0` is absent.

- [x] 7. Implement event handlers and state mutations
  - [x] 7.1 Implement `handleSetBalance`, `showFieldError`, and `clearFieldError`
    - `showFieldError(id, msg)`: set `document.getElementById(id).textContent = msg`.
    - `clearFieldError(id)`: set `textContent = ''`.
    - `handleSetBalance(e)`: `e.preventDefault()`; read `#balance-input` value; call `validateBalance`; on invalid call `showFieldError('balance-error', error)`; on valid call `setBalance(value)` which mutates `state.balance`, calls `persistState()`, `renderBalanceDisplay()`, and clears the input and error.
    - _Requirements: 3.3, 3.4, 3.6_

  - [x] 7.2 Implement `handleAddExpense` and `handleCategoryTab`
    - `handleCategoryTab(cat)`: update hidden `#expense-category` value; remove `category-tab--active` from all tabs; add it to the clicked tab.
    - `handleAddExpense(e)`: `e.preventDefault()`; read name, amount, category; call `validateExpense`; on errors call `showFieldError` for each field; on valid: build an `Expense` object (`generateId()`, `Date.now()`); call `addExpense(expense)` which unshifts to `state.expenses`, calls `persistState()`, `renderBalanceDisplay()`, `renderExpenseList()`, `renderChart()`; reset form fields and reset category to `'Food'`.
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.7, 4.8_

  - [x] 7.3 Implement `handleDeleteExpense`
    - Use event delegation: in click handler check `e.target.closest('.delete-btn')`.
    - Read `data-id` from the matched button.
    - Call `deleteExpense(id)`: filter `state.expenses`, call `persistState()`, `renderBalanceDisplay()`, `renderExpenseList()`, `renderChart()`.
    - _Requirements: 5.3_

  - [ ]* 7.4 Write property test for Expense Identity Uniqueness (Property 2)
    - **Property 2: Expense Identity Uniqueness**
    - **Validates: Requirements 4.7**
    - Call `generateId()` 1000 times in rapid succession; collect results into an array; assert `new Set(ids).size === 1000`.

- [x] 8. Implement `showStorageBanner`, `init`, and event listener wiring
  - [x] 8.1 Implement `showStorageBanner` and dismiss handler
    - `showStorageBanner()`: remove `hidden` attribute from `#storage-banner`.
    - Attach click handler on `#dismiss-banner` that adds `hidden` back.
    - _Requirements: 7.3_

  - [x] 8.2 Implement `init` — orchestrate startup sequence
    - `checkStorageAvailable()` → set `storageAvailable`; if `false` call `showStorageBanner()`.
    - `loadState()`.
    - `renderBalanceDisplay()`.
    - `renderCategoryTabs()`.
    - `renderExpenseList()`.
    - `initCanvas(document.getElementById('expense-chart'))`.
    - `renderChart()`.
    - Attach `submit` listener on `#balance-form` → `handleSetBalance`.
    - Attach `submit` listener on `#expense-form` → `handleAddExpense`.
    - Attach `click` delegation listener on `#expense-list` → `handleDeleteExpense`.
    - _Requirements: 1.6, 7.2_

  - [ ]* 8.3 Write property test for Persistence Round-Trip Fidelity (Property 3)
    - **Property 3: Persistence Round-Trip Fidelity**
    - **Validates: Requirements 7.1, 7.4**
    - Populate `state.expenses` with a generated array; call `persistState()`; then call `loadState()` and a fresh `loadState()`; assert the reconstructed `state.expenses` is deeply equal to the original (same `id`, `name`, `amount`, `category`, `timestamp` fields).

- [-] 9. Checkpoint — verify all core functionality
  - Open `index.html` in a browser (no server needed for a static file).
  - Confirm: header is sticky, M tricolor bars render, all five sections appear, balance form persists on reload, expenses add/delete correctly, chart and legend update, chart shows "NO DATA" when list is empty, balance turns red when negative.
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Accessibility and standards polish
  - [-] 10.1 Audit and fix semantic HTML, ARIA, and label associations
    - Verify every `<input>` has a paired `<label for="...">` (no placeholder-only labels).
    - Confirm `aria-live` attributes are on `#balance-display` (polite) and all `.field-error` spans (assertive).
    - Confirm `aria-hidden="true"` on `.m-tricolor`.
    - Confirm all delete buttons have `aria-label="Delete expense: {name}"`.
    - Confirm `<canvas>` `aria-label` is updated on every `renderChart()` call.
    - _Requirements: 8.1, 8.3, 8.4_

  - [-] 10.2 Audit and fix color contrast ratios
    - Verify all foreground/background text pairs meet WCAG AA: white `#ffffff` on `#111111` surface, muted `#7e7e7e` on `#000000` (adjust to `#8a8a8a` if needed), error red `#e22718` on black.
    - Verify focus ring `#1c69d4` on `#000000` meets 3:1 for UI components.
    - _Requirements: 8.6, 8.2_

  - [ ] 10.3 Keyboard navigation and offline verification
    - Tab through all interactive elements in order; verify focus indicators are visible on every element.
    - Verify pressing Enter inside `#balance-input` submits the balance form.
    - Simulate offline (DevTools → Network → Offline) and confirm the app loads, renders, and accepts expense entry from existing localStorage data.
    - _Requirements: 1.6, 8.2_

- [~] 11. Final checkpoint — all requirements covered
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP.
- Each task references specific requirements for traceability.
- Property tests (tasks 4.3, 5.2, 5.3, 5.6, 6.4, 7.4, 8.3) each map to a named Correctness Property in `design.md`.
- Checkpoints (tasks 9 and 11) are manual verification steps, not automated tests.
- The entire app must work offline with no CDN or external requests — verified in task 10.3.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["3.1"] },
    { "id": 1, "tasks": ["2.1", "3.2"] },
    { "id": 2, "tasks": ["2.2", "2.3", "4.1", "4.2"] },
    { "id": 3, "tasks": ["2.4", "2.5", "4.3", "5.1"] },
    { "id": 4, "tasks": ["2.6", "2.7", "2.8", "5.2", "5.3", "5.4", "5.5"] },
    { "id": 5, "tasks": ["5.6", "6.1", "6.2", "7.4"] },
    { "id": 6, "tasks": ["6.3", "7.1", "7.2", "7.3"] },
    { "id": 7, "tasks": ["6.4", "8.1", "8.2"] },
    { "id": 8, "tasks": ["8.3", "10.1", "10.2", "10.3"] }
  ]
}
```
