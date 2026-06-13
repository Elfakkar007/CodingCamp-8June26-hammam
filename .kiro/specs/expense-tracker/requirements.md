# Requirements Document

## Introduction

A mobile-friendly expense tracker web application built with pure HTML, CSS, and Vanilla JavaScript. The app runs entirely in the browser, persisting all data via the LocalStorage API. It follows the BMW M design language: near-pure black canvas, white typography, M tricolor accents (blue → dark blue → red), zero border-radius elements, uppercase letterspaced labels, and a strong typographic hierarchy. The app has five primary sections: a header/title, a balance section, an expense entry form, an expense history list, and a chart/diagram for visual spend breakdown.

## Glossary

- **App**: The expense tracker web application delivered as a single HTML page.
- **Balance**: The user-defined starting or remaining budget figure stored and displayed by the App.
- **Expense**: A single spending record consisting of an item name, a monetary amount, and a category.
- **Category**: A predefined label that classifies an Expense. Valid values: Food, Transport, Entertainment, Shopping, Health, Other.
- **Expense_List**: The ordered collection of all recorded Expenses displayed in the history section.
- **Chart**: The visual diagram (doughnut/pie style using Canvas API) rendering the proportional spend per Category.
- **LocalStorage**: The browser's Web Storage API used for all client-side data persistence.
- **Balance_Display**: The read-only figure shown in the Balance section reflecting current remaining balance.
- **Balance_Input**: The numeric input field that allows the user to set or update the Balance.
- **Expense_Form**: The UI form containing inputs for item name, amount, and category.
- **BMW_M_Design**: The visual design language defined by a near-pure black (#000000) canvas, white typography, M tricolor accent (#0066b1 → #1c69d4 → #e22718) used only on interactive elements (buttons, active tabs, focus indicators), zero border-radius, uppercase letterspaced labels, weight 700 headlines, and weight 300 body text.

---

## Requirements

### Requirement 1: Application Shell and Layout

**User Story:** As a user, I want a single-page mobile-friendly web app, so that I can track expenses from any device without installing anything.

#### Acceptance Criteria

1. THE App SHALL render a single HTML page (`index.html`) that contains all five sections: Header, Balance, Expense Form, Expense List, and Chart.
2. THE App SHALL apply the BMW_M_Design system: `#000000` background, white (`#ffffff`) primary text, M tricolor accents used only on interactive elements (buttons, active category tabs, and focus ring indicators), zero border-radius on all cards/buttons/inputs, and `BMW Type Next Latin` font with fallback `Inter, system-ui, sans-serif`.
3. THE App SHALL use `font-weight: 700` for all headings and section titles, and `font-weight: 300` for all body/label text.
4. THE App SHALL display without horizontal scrollbar or overflow at viewport widths from 320 px to 1440 px; below 768 px all sections SHALL stack in a single column and all content SHALL be constrained within the viewport width.
5. THE App SHALL use uppercase, letter-spaced (`letter-spacing: 0.1em`) text for all button labels and category tab labels.
6. WHERE the app is opened as a standalone web app (via browser or added to home screen) without a network connection, THE App SHALL render all five sections, allow expense entry, display the expense list, calculate the balance, and render the chart using only locally stored data and no external network requests.

---

### Requirement 2: Header / Title Section

**User Story:** As a user, I want a clear header at the top of the page, so that I immediately understand the app's purpose.

#### Acceptance Criteria

1. THE App SHALL display a header section containing the application title "EXPENSE TRACKER" in uppercase with `font-weight: 700`.
2. THE App SHALL render the M tricolor as a decorative accent element (three horizontal color bars: `#0066b1`, `#1c69d4`, `#e22718`) within the header, each bar no taller than 4 px, with `aria-hidden="true"` so the decorative bars are hidden from assistive technologies.
3. THE App SHALL keep the full header visible at the top of the viewport at all times, regardless of how far down the page the user has scrolled.

---

### Requirement 3: Balance Section

**User Story:** As a user, I want to set and view my remaining balance, so that I know how much budget I have left after expenses.

#### Acceptance Criteria

1. THE App SHALL display a Balance section showing the current Balance_Display value formatted as a currency string using the browser's locale (defaulting to `id-ID` / Indonesian Rupiah format, e.g., `Rp 500.000`) if no locale preference has been saved.
2. THE Balance_Display SHALL reflect the initial Balance minus the sum of all recorded Expense amounts.
3. WHEN the user enters a numeric value between 0 and 999,999,999 (inclusive) into Balance_Input and confirms (presses Enter or clicks the "SET BALANCE" button), THE App SHALL update the stored Balance in LocalStorage, recalculate Balance_Display immediately, and clear the Balance_Input field.
4. IF the user submits a non-numeric value in Balance_Input, THEN THE App SHALL display the inline validation error "Please enter a valid number" and SHALL NOT update the stored Balance. IF the user submits a negative or zero value, THEN THE App SHALL display the inline validation error "Balance must be greater than zero" and SHALL NOT update the stored Balance.
5. WHEN the remaining balance falls below zero, THE Balance_Display SHALL render in the M red accent color (`#e22718`) to signal overspending.
6. THE App SHALL persist the Balance value in LocalStorage under the key `expenseTracker_balance` so that it is restored on every subsequent page load.
7. WHEN the page loads for the first time and no stored Balance exists in LocalStorage, THE Balance_Display SHALL show `Rp 0` (or the locale-equivalent of zero) and Balance_Input SHALL be empty.

---

### Requirement 4: Expense Form Section

**User Story:** As a user, I want to add a new expense with a name, amount, and category, so that I can record every spending event quickly.

#### Acceptance Criteria

1. THE Expense_Form SHALL contain three inputs: a text field for item name (max 250 characters), a numeric field for amount, and a category selector listing exactly the six Categories: Food, Transport, Entertainment, Shopping, Health, Other.
2. WHEN the user has entered a non-empty item name (≤ 250 characters), a positive numeric amount (≤ 999,999,999.99), and a selected category, and clicks the "ADD EXPENSE" button, THE App SHALL create a new Expense record, prepend it to the Expense_List, persist all Expenses to LocalStorage, and clear the item name and amount fields while resetting the category selector to "Food".
3. IF the user clicks "ADD EXPENSE" with an empty item name field OR an item name exceeding 250 characters, THEN THE Expense_Form SHALL display the inline error "Item name is required" (empty) or "Item name must be 250 characters or fewer" (too long) and SHALL NOT create an Expense record.
4. IF the user clicks "ADD EXPENSE" with an empty amount field, a non-numeric value, a value ≤ 0, or a value > 999,999,999.99, THEN THE Expense_Form SHALL display the inline error "Enter a valid amount" and SHALL NOT create an Expense record.
5. WHEN a new Expense is successfully added, THE Balance_Display SHALL update to reflect the new remaining balance within 1 second and without a page reload.
6. THE Expense_Form SHALL display category options as styled tab buttons following BMW_M_Design (uppercase, zero border-radius, M blue active state `#0066b1`).
7. THE App SHALL assign a unique identifier to each Expense at creation time such that no two Expenses in the Expense_List share the same identifier, even when Expenses are added in rapid succession.
8. WHEN the Expense_Form is first displayed or after a successful submission, the category selector SHALL default to "Food" as the selected category.

---

### Requirement 5: Expense List Section

**User Story:** As a user, I want to see a history of all my expenses, so that I can review what I've spent and on what.

#### Acceptance Criteria

1. THE Expense_List SHALL display each Expense as a row showing: item name (truncated at 40 characters with an ellipsis if longer), category badge, amount formatted as a currency string matching the Balance_Display format, and a delete button.
2. THE Expense_List SHALL render Expenses in reverse-chronological order (most recent first).
3. WHEN the user clicks the delete button on an Expense row, THE App SHALL immediately remove that Expense row from the rendered list, delete it from LocalStorage, and recalculate Balance_Display — all without a page reload.
4. WHILE the Expense_List is empty, THE App SHALL display the placeholder message "NO EXPENSES RECORDED YET" in uppercase, with `color: #7e7e7e` and `font-weight: 300`, centered horizontally within the list container.
5. THE App SHALL persist all Expenses in LocalStorage under the key `expenseTracker_expenses` so that the full Expense_List is restored on every subsequent page load.
6. THE Expense_List SHALL display each Expense's category as a colored badge using the following fixed per-category color mapping: Food `#0066b1`, Transport `#1c69d4`, Entertainment `#e22718`, Shopping `#f4b400`, Health `#0fa336`, Other `#7e7e7e`.

---

### Requirement 6: Chart / Diagram Section

**User Story:** As a user, I want a visual breakdown of my spending by category, so that I can quickly see where my money is going.

#### Acceptance Criteria

1. THE Chart SHALL render a doughnut-style diagram using the HTML Canvas API, showing proportional arc segments only for Categories whose total spend is greater than zero; Categories with zero spend SHALL be excluded from both the rendered diagram and the legend.
2. WHEN the Expense_List is updated (Expense added or deleted), THE Chart SHALL re-render within 300 ms to reflect the current Expense data without a page reload.
3. THE Chart SHALL display a legend listing each active Category label (those with spend > 0) alongside its corresponding per-category color (as defined in Requirement 5 criterion 6) and total spend amount formatted as a currency string matching the Balance_Display locale format.
4. WHEN the Expense_List is empty, THE Chart SHALL display the centered text "NO DATA" on the canvas instead of rendering arc segments.
5. THE Chart SHALL use the per-category color palette defined in Requirement 5 criterion 6 for its arc segments, assigning each Category its fixed color regardless of spend rank.

---

### Requirement 7: Data Persistence and State Management

**User Story:** As a user, I want my data to survive page refreshes, so that I don't lose my expense history when I close or reload the browser tab.

#### Acceptance Criteria

1. THE App SHALL store the Balance under the exact LocalStorage key `expenseTracker_balance` and the Expense_List under the exact LocalStorage key `expenseTracker_expenses`.
2. WHEN the page loads, THE App SHALL read all data from LocalStorage and render the complete Balance_Display, Expense_List, and Chart before making any input element interactive or responding to any user events.
3. IF LocalStorage is unavailable or throws an error during any read or write operation, THEN THE App SHALL display a non-blocking warning banner with the text "LOCAL STORAGE UNAVAILABLE — DATA WILL NOT BE SAVED" that persists for the duration of the session and is dismissible by the user, and SHALL continue operating in-memory.
4. THE App SHALL serialize Expenses as a JSON array in LocalStorage, where each entry contains: `id`, `name`, `amount`, `category`, and `timestamp` fields.
5. IF LocalStorage contains a value for `expenseTracker_expenses` that cannot be parsed as a valid JSON array, THEN THE App SHALL discard the corrupted value, initialize the Expense_List as empty, and display the warning banner defined in criterion 3.

---

### Requirement 8: Accessibility and Standards Compliance

**User Story:** As a user relying on keyboard navigation or assistive technology, I want the app to be navigable and understandable, so that I can use it regardless of my input method.

#### Acceptance Criteria

1. THE App SHALL use semantic HTML5 elements (`<header>`, `<main>`, `<section>`, `<form>`, `<button>`, `<ul>`, `<li>`) for all major structural components.
2. THE App SHALL provide a visible focus indicator on all interactive elements (buttons, inputs, delete icons) with a CSS `outline` whose color has a contrast ratio of at least 3:1 against the `#000000` background.
3. THE App SHALL associate every form input with a `<label>` element using matching `for` / `id` attributes, and no input SHALL be labelled solely via placeholder text.
4. THE Chart canvas SHALL include an `aria-label` attribute with a value that describes the current diagram content, updated to reflect the current category breakdown whenever the chart re-renders (e.g., "Expense breakdown by category: Food Rp 50.000, Transport Rp 30.000").
5. THE App SHALL achieve a Lighthouse Accessibility score of at least 90 when audited in Chrome DevTools on the production build.
6. THE App SHALL ensure all text elements used in the UI meet WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text) against their background color.
