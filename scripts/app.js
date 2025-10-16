import { getRecords, addRecord, deleteRecord } from "./state.js";
import { 
  DESC_PATTERN, 
  AMOUNT_PATTERN, 
  DATE_PATTERN,
  validateField 
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

  // --- RENDER FUNCTIONS --- //
  function renderRecords() {
    const records = getRecords();
    if (!tableBody) return;

    tableBody.innerHTML = "";

    if (records.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5">No records found.</td></tr>`;
      return;
    }

    records.forEach((record, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${escapeHtml(record.description)}</td>
        <td>$${record.amount}</td>
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

console.log("Form values → desc:", descInput?.value, 
            "| amt:", amountInput?.value, 
            "| cat:", categoryInput?.value, 
            "| date:", dateInput?.value);


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

  console.log("🆕 Adding record:", newRecord);

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
