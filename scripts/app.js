import { getRecords, addRecord, deleteRecord } from "./state.js";
import { 
  DESC_PATTERN, 
  AMOUNT_PATTERN, 
  DATE_PATTERN,
  validateField,
  compileRegex,
  highlightMatches,
} from "./regex.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("App loaded");

  const tableBody = document.querySelector(".records-table tbody");
  const searchInput = document.getElementById("search");
  const caseToggleBtn = document.getElementById("case-toggle");
  let isCaseSensitive = false;

  if (caseToggleBtn) {
    caseToggleBtn.setAttribute("aria-pressed", "false");
  }

  // Escape user input to prevent HTML injection
  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // --- RENDER FUNCTIONS --- //
  function getSearchRegex() {
    if (!searchInput) return null;
    const query = searchInput.value?.trim();
    if (!query) return null;

    const flags = isCaseSensitive ? "" : "i";
    let re = compileRegex(query, flags);
    if (!re) {
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      re = new RegExp(escaped, flags);
    }
    return re;
  }

  function renderRecords() {
    const records = getRecords();
    if (!tableBody) return;

    tableBody.innerHTML = "";

    const re = getSearchRegex();
    const listToRender = re
      ? records.filter((r) => {
          const desc = String(r.description || "");
          const cat = String(r.category || "");
          return re.test(desc) || re.test(cat);
        })
      : records;

    if (listToRender.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5">No records found.</td></tr>`;
      return;
    }

    listToRender.forEach((record, index) => {
      const row = document.createElement("tr");

      const descHtml = re
        ? highlightMatches(String(record.description || ""), re)
        : escapeHtml(String(record.description || ""));
      const categoryHtml = re
        ? highlightMatches(String(record.category || ""), re)
        : escapeHtml(String(record.category || ""));

      row.innerHTML = `
        <td>${descHtml}</td>
        <td>$${record.amount}</td>
        <td>${categoryHtml}</td>
        <td>${record.date}</td>
        <td><button class="delete-btn" data-id="${record.id}" data-index="${index}">Delete</button></td>
      `;
      tableBody.appendChild(row);
    });
  }

  function renderSummary() {
    const records = getRecords();
    const total = records.reduce((s, r) => s + Number(r.amount || 0), 0);

    const totalEl = document.getElementById("total-spent");
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;

    const catTotals = {};
    records.forEach(r => {
      const cat = r.category || "Other";
      catTotals[cat] = (catTotals[cat] || 0) + Number(r.amount || 0);
    });

    const topCategoryEl = document.getElementById("top-category");
    const top = Object.keys(catTotals).length
      ? Object.entries(catTotals).sort((a,b)=>b[1]-a[1])[0][0]
      : "None";
    if (topCategoryEl) topCategoryEl.textContent = top;

    renderChart(records);
  }
   
   // --- Budget Feature ---
const budgetForm = document.getElementById("budget-form");
const budgetInput = document.getElementById("budget-amount");
const budgetValue = document.getElementById("budget-value");
const spentValue = document.getElementById("spent-value");
const remainingValue = document.getElementById("remaining-value");

let budget = Number(localStorage.getItem("budget") || 0);

function renderBudget() {
  if (!budgetValue || !spentValue || !remainingValue) return; // Exit if elements don't exist
  
  const records = getRecords();
  const spent = records.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const remaining = budget - spent;

  budgetValue.textContent = `$${budget.toFixed(2)}`;
  spentValue.textContent = `$${spent.toFixed(2)}`;
  remainingValue.textContent = `$${remaining.toFixed(2)}`;

  if (remaining < 0) {
    remainingValue.style.color = "red";
  } else {
    remainingValue.style.color = "green";
  }
}

if (budgetForm && budgetInput) {
budgetForm.addEventListener("submit", (e) => {
  e.preventDefault();
  budget = Number(budgetInput.value);
  localStorage.setItem("budget", budget);
  renderBudget();
  budgetInput.value = "";
});

// Call it during page refresh
renderBudget();
}

// ==========================
// SETTINGS FUNCTIONALITY
// ==========================

const settingsForm = document.getElementById("settings-form");
const baseCurrencyInput = document.getElementById("base-currency");
const rate1Input = document.getElementById("rate1");
const rate2Input = document.getElementById("rate2");
const settingsStatus = document.getElementById("settings-status");

if (settingsForm && baseCurrencyInput && rate1Input && rate2Input) {
  // Load settings from localStorage on startup
  const savedSettings = JSON.parse(localStorage.getItem("settings"));
  if (savedSettings) {
    baseCurrencyInput.value = savedSettings.baseCurrency || "";
    rate1Input.value = savedSettings.rate1 || "";
    rate2Input.value = savedSettings.rate2 || "";
  }

  // Save on explicit form submit (button click)
  settingsForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const settings = {
      baseCurrency: baseCurrencyInput.value.trim(),
      rate1: parseFloat(rate1Input.value) || 1,
      rate2: parseFloat(rate2Input.value) || 1,
    };
    localStorage.setItem("settings", JSON.stringify(settings));
    if (settingsStatus) {
      settingsStatus.textContent = "✓ Settings saved successfully";
      settingsStatus.style.color = "green";
    }
  });
}

  function renderChart(records) {
    const chartContainer = document.getElementById("chart");
    if (!chartContainer) return;

    const today = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(d.toISOString().split("T")[0]);
    }

    const totalsByDate = {};
    days.forEach(d => totalsByDate[d] = 0);

    records.forEach(r => {
      if (!r.date) return;
      if (totalsByDate.hasOwnProperty(r.date)) {
        totalsByDate[r.date] += Number(r.amount || 0);
      }
    });

    chartContainer.innerHTML = "";
    const chart = document.createElement("div");
    chart.className = "bar-chart";

    Object.entries(totalsByDate).forEach(([date, amount]) => {
      const barWrap = document.createElement("div");
      barWrap.className = "bar-wrap";
      const bar = document.createElement("div");
      bar.className = "bar";
      bar.style.height = `${Math.max(4, amount * 0.25)}px`;
      bar.title = `$${amount.toFixed(2)} on ${date}`;
      const label = document.createElement("div");
      label.className = "bar-label";
      label.textContent = date.slice(5);
      barWrap.appendChild(bar);
      barWrap.appendChild(label);
      chart.appendChild(barWrap);
    });
    chartContainer.appendChild(chart);
  }

  function refreshAll() {
    renderRecords();
    renderSummary();
    renderBudget();
  }

  // Initial render
  refreshAll();

  // --- DELETE FUNCTIONALITY --- //
  if (tableBody) {
    tableBody.addEventListener("click", (e) => {
      if (e.target.classList.contains("delete-btn")) {
        const idFromDataset = e.target.dataset.id;
        let idToDelete = idFromDataset;

        if (!idToDelete && typeof e.target.dataset.index !== "undefined") {
          const idx = Number(e.target.dataset.index);
          const records = getRecords();
          idToDelete = records[idx]?.id;
        }

        if (idToDelete) {
          deleteRecord(idToDelete);
          refreshAll();
          console.log("Record deleted ❌:", idToDelete);
        }
      }
    });
  }

  // --- SEARCH FUNCTIONALITY --- //
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderRecords();
    });
  }

  if (caseToggleBtn) {
    caseToggleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      isCaseSensitive = !isCaseSensitive;
      caseToggleBtn.setAttribute(
        "aria-pressed",
        isCaseSensitive ? "true" : "false"
      );
      renderRecords();
    });
  }

  // --- FORM VALIDATION SETUP --- //
  const form = document.getElementById("transaction-form");
  if (!form) {
    console.log("No form found — skipping validation setup.");
    return;
  }

  console.log("Setting up form validation...");

  const descInput = document.getElementById("description");
  const amountInput = document.getElementById("amount");
  const categoryInput = document.getElementById("category");
  const dateInput = document.getElementById("date");

  const descMsg = document.getElementById("description-msg");
  const amountMsg = document.getElementById("amount-msg");
  const categoryMsg = document.getElementById("category-msg");
  const dateMsg = document.getElementById("date-msg");
  const formStatus = document.getElementById("form-status");

  if (!descInput || !amountInput || !categoryInput || !dateInput) {
    console.error("Some form inputs are missing!");
    return;
  }

  console.log("All form elements found ✓");

  // Input validation listeners
  descInput.addEventListener("input", () => {
    validateField(descInput, DESC_PATTERN, descMsg, "Invalid description.");
  });
  
  amountInput.addEventListener("input", () => {
    validateField(amountInput, AMOUNT_PATTERN, amountMsg, "Invalid amount.");
  });

  categoryInput.addEventListener("change", () => {
    if (categoryInput.value) {
      categoryMsg.textContent = "";
      categoryInput.style.borderColor = "";
    } else {
      categoryMsg.textContent = "Please select a category.";
      categoryMsg.style.color = "red";
      categoryInput.style.borderColor = "red";
    }
  });

  dateInput.addEventListener("input", () => {
    validateField(dateInput, DATE_PATTERN, dateMsg, "Invalid date.");
  });

// --- SUBMIT HANDLER --- //
form.addEventListener("submit", (e) => {
  e.preventDefault();
  console.log("🔍 Form submitted - validating all fields...");

  console.log(
    "Form values → desc:",
    descInput?.value,
    "| amt:",
    amountInput?.value,
    "| cat:",
    categoryInput?.value,
    "| date:",
    dateInput?.value
  );

  const validDesc = validateField(descInput, DESC_PATTERN, descMsg, "Invalid description.");
  const validAmt = validateField(amountInput, AMOUNT_PATTERN, amountMsg, "Invalid amount.");
  const validCat = categoryInput.value !== "";
  const validDate = validateField(dateInput, DATE_PATTERN, dateMsg, "Invalid date.");

  console.log(
    `✅ Validation check → Desc: ${validDesc}, Amt: ${validAmt}, Cat: ${validCat}, Date: ${validDate}`
  );

  // If any field is invalid, show the correct error message and stop form submission
  if (!validDesc || !validAmt || !validCat || !validDate) {
    if (!validDesc && descMsg) descMsg.textContent = "Description is required.";
    if (!validAmt && amountMsg) amountMsg.textContent = "Amount is required.";
    if (!validCat && categoryMsg) categoryMsg.textContent = "Category is required.";
    if (!validDate && dateMsg) dateMsg.textContent = "Date is required.";

    if (formStatus) {
      formStatus.textContent = "⚠️ Please fix the highlighted errors.";
      formStatus.style.color = "red";
    }

    return; // ⛔ stop here if invalid
  }

  // ✅ All fields valid — continue saving
  const newRecord = {
    description: descInput.value.trim(),
    amount: Number(amountInput.value),
    category: categoryInput.value,
    date: dateInput.value,
  };

  console.log("🧩 Saving new record:", newRecord);

  addRecord(newRecord);
  refreshAll();

  if (formStatus) {
    formStatus.textContent = "✓ Transaction saved successfully!";
    formStatus.style.color = "green";
  }

  form.reset();

  // Clear success message after 3 seconds
  setTimeout(() => (formStatus.textContent = ""), 3000);
});

});