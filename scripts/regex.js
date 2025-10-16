// scripts/regex.js
// Regex utilities for Student Finance Tracker

// --- BASIC VALIDATORS ---

/** Description/title: letters, spaces, punctuation; no numbers */
export const DESC_PATTERN = /^(?!.*\d)[A-Za-z\s.,'’-]+$/i;

/** Numeric field: whole number or decimal (1–2 digits after .) */
export const AMOUNT_PATTERN = /^(0|[1-9]\d*)(\.\d{1,2})?$/;

/** Date YYYY-MM-DD with month/day validation */
export const DATE_PATTERN =/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

/** Category/tag: letters, spaces, or hyphens */
export const CATEGORY_PATTERN = /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/;

/** Advanced: duplicate word (back-reference) */
export const DUPLICATE_WORD_PATTERN = /\b(\w+)\s+\1\b/i;

  // --- FIELD VALIDATION ---

/**
 * Validates a field against a regex pattern and updates the message span.
 * @param {HTMLInputElement} input - The input field.
 * @param {RegExp} regex - The pattern to test.
 * @param {HTMLElement} messageSpan - The <small> element for feedback.
 * @param {string} msg - The error message.
 * @returns {boolean} - True if valid, false otherwise.
 */
export function validateField(input, regex, messageSpan, msg) {
  if (!input || !messageSpan) return false;

  const value = input.value.trim();

  // Empty check
  if (!value) {
    messageSpan.textContent = "This field is required.";
    messageSpan.style.color = "red";
    input.style.borderColor = "red";
    return false;
  }

  // Pattern validation
  if (!regex.test(value)) {
    messageSpan.textContent = msg;
    messageSpan.style.color = "red";
    input.style.borderColor = "red";
    return false;
  }

  // Extra: check invalid calendar dates (like 2025-02-30)
  if (input.id === "date") {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(`${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}T00:00`);
  if (isNaN(date.getTime())) {
    messageSpan.textContent = "Enter a valid calendar date.";
    messageSpan.style.color = "red";
    input.style.borderColor = "red";
    return false;
  }
}

  // ✅ If valid
  messageSpan.textContent = "";
  input.style.borderColor = "green";
  return true;
}


// --- HELPER UTILITIES ---

export function compileRegex(input, flags = "i") {
  try {
    return input ? new RegExp(input, flags) : null;
  } catch {
    return null;
  }
}

export function normalizeDescription(s = "") {
  return String(s).trim().replace(/\s{2,}/g, " ");
}

export function isValidDescription(s) {
  if (!s) return false;
  const norm = normalizeDescription(s);
  return DESC_PATTERN.test(norm) && !DUPLICATE_WORD_PATTERN.test(norm);
}

export function hasDuplicateWord(s) {
  return DUPLICATE_WORD_PATTERN.test(String(s));
}

export function isValidAmount(s) {
  return AMOUNT_PATTERN.test(String(s));
}

export function isValidDate(s) {
  return DATE_PATTERN.test(String(s));
}

export function isValidCategory(s) {
  return CATEGORY_PATTERN.test(String(s));
}

export function highlightMatches(text, re) {
  if (!re) return escapeHtml(text);
  const escaped = escapeHtml(String(text));
  const flags = re.flags.includes("g") ? re.flags : re.flags + "g";
  const safeRe = new RegExp(re.source, flags);
  return escaped.replace(safeRe, (m) => `<mark>${escapeHtml(m)}</mark>`);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
