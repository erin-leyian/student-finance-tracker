import { getRecords, addRecord, deleteRecord } from "./state.js";
import { 
  DESC_PATTERN, 
  AMOUNT_PATTERN, 
  DATE_PATTERN,
  validateField, 
} from "./regex.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("App loaded");

  const tableBody = document.querySelector(".records-table tbody");

  // Escape user input to prevent HTML injection
  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // ==========================
  // CURRENCY FUNCTIONS (DEFINE ONCE)
  // ==========================
  
  // Load settings with defaults
  function loadSettings() {
    const savedSettings = JSON.parse(localStorage.getItem("settings")) || {};
    return {
      baseCurrency: savedSettings.baseCurrency || "USD",
      rate1: savedSettings.rate1 || 1,
      rate2: savedSettings.rate2 || 1,
    };
  }

  // Get currency symbol
  function getCurrencySymbol(currencyCode) {
    const symbols = {
      USD: '$',
      RWF: 'FRw',
      KES: 'KSh'
    };
    return symbols[currencyCode.toUpperCase()] || '$';
  }

  // Format amount with currency
  function formatCurrency(amount, currency = "USD") {
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${Number(amount).toFixed(2)}`;
  }

  // ==========================
  // RENDER FUNCTIONS
  // ==========================
  
  function renderRecords() {
    const records = getRecords();
    if (!tableBody) return;

    tableBody.innerHTML = "";

    if (records.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5">No records found.</td></tr>`;
      return;
    }

    const settings = loadSettings();
    
    records.forEach((record, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${escapeHtml(record.description)}</td>
        <td>${formatCurrency(record.amount, settings.baseCurrency)}</td>
        <td>${escapeHtml(record.category)}</td>
        <td>${record.date}</td>
        <td><button class="delete-btn" data-index="${index}">Delete</button></td>
      `;
      tableBody.appendChild(row);
    });
  }

  function renderSummary() {
    const records = getRecords();
    const total = records.reduce((s, r) => s + Number(r.amount || 0), 0);
    const settings = loadSettings();

    const totalEl = document.getElementById("total-spent");
    if (totalEl) totalEl.textContent = formatCurrency(total, settings.baseCurrency);

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
    if (!budgetValue || !spentValue || !remainingValue) return;
    
    const records = getRecords();
    const spent = records.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    const remaining = budget - spent;
    const settings = loadSettings();

    budgetValue.textContent = formatCurrency(budget, settings.baseCurrency);
    spentValue.textContent = formatCurrency(spent, settings.baseCurrency);
    remainingValue.textContent = formatCurrency(remaining, settings.baseCurrency);
    
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
    renderBudget();
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

    const settings = loadSettings();

    Object.entries(totalsByDate).forEach(([date, amount]) => {
      const barWrap = document.createElement("div");
      barWrap.className = "bar-wrap";
      const bar = document.createElement("div");
      bar.className = "bar";
      bar.style.height = `${Math.max(4, amount * 0.25)}px`;
      bar.title = `${formatCurrency(amount, settings.baseCurrency)} on ${date}`;
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
        const idx = Number(e.target.dataset.index);
        const records = getRecords();
        const recordToDelete = records[idx];
        if (recordToDelete) {
          deleteRecord(recordToDelete.id);
          refreshAll();
          console.log("Record deleted ❌:", recordToDelete.id);
        }
      }
    });
  }

  // ==========================
  // SETTINGS FUNCTIONALITY
  // ==========================
  const baseCurrencyInput = document.getElementById("base-currency");
  const rate1Input = document.getElementById("rate1");
  const rate2Input = document.getElementById("rate2");
  const settingsForm = document.getElementById("settings-form");
  const settingsStatus = document.getElementById("settings-status");

  // Validate currency input
  function validateCurrency(input) {
    const value = input.value.trim().toUpperCase();
    const isValid = /^(USD|RWF|KES)$/.test(value);
    
    if (!isValid && value !== "") {
      input.style.borderColor = "red";
      if (settingsStatus) {
        settingsStatus.textContent = "❌ Invalid currency. Use USD, RWF, or KES only.";
        settingsStatus.style.color = "red";
      }
      return false;
    }
    
    input.style.borderColor = "green";
    if (settingsStatus) {
      settingsStatus.textContent = "";
    }
    return true;
  }

  // Update ALL currency displays in the app
  function updateAllCurrencyDisplays() {
    const settings = loadSettings();
    console.log(`Updating currency displays to: ${settings.baseCurrency}`);
    
    // Refresh everything to ensure consistency
    refreshAll();
  }

  // Initialize settings
  if (baseCurrencyInput && rate1Input && rate2Input && settingsForm) {
    // Load saved settings
    const settings = loadSettings();
    baseCurrencyInput.value = settings.baseCurrency;
    rate1Input.value = settings.rate1;
    rate2Input.value = settings.rate2;
    
    // Apply current currency on page load
    updateAllCurrencyDisplays();

    // Currency validation on input
    baseCurrencyInput.addEventListener("input", () => {
      validateCurrency(baseCurrencyInput);
    });

    // Save settings with form submission
    settingsForm.addEventListener("submit", (e) => {
      e.preventDefault();
      
      // Validate currency
      if (!validateCurrency(baseCurrencyInput)) {
        return;
      }
      
      const settings = {
        baseCurrency: baseCurrencyInput.value.trim().toUpperCase(),
        rate1: parseFloat(rate1Input.value) || 1,
        rate2: parseFloat(rate2Input.value) || 1,
      };
      
      localStorage.setItem("settings", JSON.stringify(settings));
      
      if (settingsStatus) {
        settingsStatus.textContent = "✅ Settings saved successfully! Currency updated across the app.";
        settingsStatus.style.color = "green";
      }
      
      // Update ALL currency displays
      updateAllCurrencyDisplays();
      
      // Clear status after 3 seconds
      setTimeout(() => {
        if (settingsStatus) settingsStatus.textContent = "";
      }, 3000);
    });

    // Also save on individual input changes (optional)
    [rate1Input, rate2Input].forEach(input => {
      input.addEventListener("change", () => {
        settingsForm.dispatchEvent(new Event('submit'));
      });
    });
  }

  // ==========================
  // FORM VALIDATION (ONLY ON ADD.HTML)
  // ==========================
  const form = document.getElementById("transaction-form");
  if (form) {
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

      const validDesc = validateField(descInput, DESC_PATTERN, descMsg, "Invalid description.");
      const validAmt = validateField(amountInput, AMOUNT_PATTERN, amountMsg, "Invalid amount.");
      const validCat = categoryInput.value !== "";
      const validDate = validateField(dateInput, DATE_PATTERN, dateMsg, "Invalid date.");

      if (!validDesc || !validAmt || !validCat || !validDate) {
        if (!validDesc && descMsg) descMsg.textContent = "Description is required.";
        if (!validAmt && amountMsg) amountMsg.textContent = "Amount is required.";
        if (!validCat && categoryMsg) categoryMsg.textContent = "Category is required.";
        if (!validDate && dateMsg) dateMsg.textContent = "Date is required.";

        if (formStatus) {
          formStatus.textContent = "⚠️ Please fix the highlighted errors.";
          formStatus.style.color = "red";
        }
        return;
      }

      const newRecord = {
        description: descInput.value.trim(),
        amount: Number(amountInput.value),
        category: categoryInput.value,
        date: dateInput.value,
      };

      addRecord(newRecord);
      refreshAll();

      if (formStatus) {
        formStatus.textContent = "✓ Transaction saved successfully!";
        formStatus.style.color = "green";
      }

      form.reset();

      setTimeout(() => (formStatus.textContent = ""), 3000);
    });
  } else {
    console.log("No form found — this is normal on pages like index.html");
  }

  // ==========================
  // SEARCH FUNCTIONALITY (WORKS ON ALL PAGES)
  // ==========================
  const searchInput = document.getElementById("search-input");
  const searchButton = document.getElementById("search-btn");

  function renderFilteredRecords(query) {
    const allRecords = getRecords();
    const tableBody = document.querySelector(".records-table tbody");

    if (!tableBody) return;
    
    if (!query.trim()) {
      renderRecords();
      return;
    }

    let regex;
    try {
      regex = new RegExp(query, "i");
    } catch (e) {
      alert("Invalid regular expression. Please check your syntax.");
      renderRecords();
      return;
    }

    const filtered = allRecords.filter(record => {
      const matches = regex.test(record.description) ||
                     regex.test(record.category) ||
                     regex.test(record.amount.toString()) ||
                     regex.test(record.date);
      return matches;
    });

    tableBody.innerHTML = "";

    if (filtered.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5">No matching transactions found.</td></tr>`;
      return;
    }

    const settings = loadSettings();

    filtered.forEach((record, index) => {
      const originalIndex = allRecords.findIndex(r => r.id === record.id);
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${escapeHtml(record.description)}</td>
        <td>${formatCurrency(record.amount, settings.baseCurrency)}</td>
        <td>${escapeHtml(record.category)}</td>
        <td>${record.date}</td>
        <td><button class="delete-btn" data-index="${originalIndex}">Delete</button></td>
      `;
      tableBody.appendChild(row);
    });
  }

  if (searchInput && searchButton) {
    searchButton.addEventListener("click", () => {
      renderFilteredRecords(searchInput.value);
    });

    searchInput.addEventListener("input", () => {
      renderFilteredRecords(searchInput.value);
    });
  }
});