
import { getRecords, addRecord } from "./state.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("App loaded ");

  function getStoredData() {
    return JSON.parse(localStorage.getItem("studentfinancestracker-data")) || [];
  }
  function saveData(data) {
    localStorage.setItem("studentfinancestracker-data", JSON.stringify(data));
  }

   const records = getRecords();
   console.log("Loaded records:", records);

   if (records.length === 0) {
    addRecord({
      description: "Lunch at cafeteria",
      amount: 12.5,
      category: "Food",
      date: "2025-10-14"
    });
  }

   const tableBody = document.querySelector(".records-table tbody");
   console.log("Table body:", tableBody);


  function renderRecords() {
     if (!tableBody) {
        console.log("No records table found on this page — skipping render 💤");
        return; // stop if not on the page with a table
    }

      const storedData = getStoredData();
      tableBody.innerHTML = "";

     storedData.forEach((record, index) => {

       const row = document.createElement("tr");

       row.innerHTML = `
         <td>${record.description}</td>
         <td>$${record.amount}</td>
         <td>${record.category}</td>
         <td>${record.date}</td>
         <td>
            <button class="delete-btn" data-index="${index}">Delete</button>
         </td>
     `;

      tableBody.appendChild(row);
   });
 }


 function renderSummary() {
    const records = getStoredData();
    const total = records.reduce((s, r) => s + Number(r.amount || 0), 0);
    const totalEl = document.getElementById("total-spent");
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;

    // top category
    const catTotals = {};
    records.forEach(r =>  {
      const cat = r.category || "Other";
      catTotals[cat] = (catTotals[cat] || 0) + Number(r.amount || 0);
    });
    const topCategoryEl = document.getElementById("top-category");
    const top = Object.keys(catTotals).length ? Object.entries(catTotals).sort((a,b)=>b[1]-a[1])[0][0] : "None";
    if (topCategoryEl) topCategoryEl.textContent = top;

    // chart (use your existing renderChart implementation, or call it here)
    renderChart(records);
  }

  function renderChart(records) {
    const chartContainer = document.getElementById("chart");
    if (!chartContainer) return;

    // Build dates for last 7 days (strings YYYY-MM-DD)
    const today = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(d.toISOString().split("T")[0]);
    }

    // Initialize totals map
    const totalsByDate = {};
    days.forEach(d => totalsByDate[d] = 0);

    // Sum amounts for matching dates only (ignore empty/invalid dates)
    records.forEach(r => {
      if (!r.date) return;
      const dateKey = r.date;
      if (totalsByDate.hasOwnProperty(dateKey)) {
        totalsByDate[dateKey] += Number(r.amount || 0);
      }
    });

    // Render bars
    chartContainer.innerHTML = "";
    const chart = document.createElement("div");
    chart.className = "bar-chart";
    Object.entries(totalsByDate).forEach(([date, amount]) => {
      const barWrap = document.createElement("div");
      barWrap.className = "bar-wrap";
      const bar = document.createElement("div");
      bar.className = "bar";
      // scale height: choose scale so small numbers visible; adjust later in CSS if needed
      bar.style.height = `${Math.max(4, amount * 0.25)}px`;
      bar.title = `$${amount.toFixed(2)} on ${date}`;
      const label = document.createElement("div");
      label.className = "bar-label";
      label.textContent = date.slice(5); // MM-DD
      barWrap.appendChild(bar);
      barWrap.appendChild(label);
      chart.appendChild(barWrap);
    });
    chartContainer.appendChild(chart);
  }

  // Combined refresh: redraw table + summary + chart
  function refreshAll() {
    renderRecords();
    renderSummary();
  }

  // Initial render on load
  refreshAll();

  // Delete button event (delegation)
  if (tableBody) {
    tableBody.addEventListener("click", (e) => {
      if (e.target.classList.contains("delete-btn")) {
        const idx = Number(e.target.dataset.index);
        if (Number.isFinite(idx)) {
          const stored = getStoredData();
          stored.splice(idx, 1);
          saveData(stored);
          refreshAll(); // <-- update everything
          console.log("Record deleted ❌ index:", idx);
        }
      }
    });
  }

  // Form submit (add new record) — safe if form exists only on add.html
  const form = document.getElementById("transaction-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      console.log("Form submitted 🎀");

      const newRecord = {
        description: document.getElementById("title")?.value?.trim() || "",
        amount: Number(document.getElementById("amount")?.value || 0),
        category: document.getElementById("category")?.value || "Other",
        date: document.getElementById("date")?.value || "",
        id: `rec_${Date.now()}`
      };

      const stored = getStoredData();
      stored.push(newRecord);
      saveData(stored);

      form.reset();
      refreshAll(); // <-- update both table and summary
      console.log("New record added ✅", newRecord);
    });
  }

  // small XSS-safe helper for inserting text into HTML (used in renderRecords)
  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

}); // end DOMContentLoaded