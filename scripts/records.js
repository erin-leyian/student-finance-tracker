console.log("Records page loaded ");

function getStoredData() {
  return JSON.parse(localStorage.getItem("studentfinancestracker-data")) || [];
}
console.log("Loaded records:", getStoredData());


function calculateTotal(records) {
  return records.reduce((sum, record) => sum + Number(record.amount || 0), 0);
}

function findTopCategory(records) {
  if (records.length === 0) return "None";

  const categoryTotals = {};

  records.forEach(record => {
    categoryTotals[record.category] = (categoryTotals[record.category] || 0) + (Number(record.amount) || 0);
  });

  return Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0][0];
}

function filterLast7Days(records) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
  return records.filter(record => record.date && new Date(record.date) >= sevenDaysAgo);
}

function renderSummary() {
  const records = getStoredData();

  // Total spent
  const total = calculateTotal(records);
  document.getElementById("total-spent").textContent = `$${total.toFixed(2)}`;

  // Top category
  const topCategory = findTopCategory(records);
  document.getElementById("top-category").textContent = topCategory;

  // Chart data
  renderChart(records);

  console.log("Records loaded:", records);
  console.log("Total spent:", total);
  console.log("Top category:", topCategory);

}

function renderChart(records) {
  const last7Days = filterLast7Days(records);
  const chartContainer = document.getElementById("chart");
  chartContainer.innerHTML = ""; // clear previous

  if (last7Days.length === 0) {
    chartContainer.innerHTML = "<p>No data for the last 7 days.</p>";
    return;
  }

  // Create a simple bar chart manually (no Chart.js yet)
  const grouped = {};
  last7Days.forEach(record => {
    grouped[record.date] = (grouped[record.date] || 0) + (Number(record.amount) || 0);
  });

  const chart = document.createElement("div");
  chart.classList.add("bar-chart");

  Object.entries(grouped).forEach(([date, amount]) => {
    const bar = document.createElement("div");
    bar.classList.add("bar");
    bar.style.height = `${amount * 5}px`; // scale up visually
    bar.title = `$${amount.toFixed(2)} on ${date}`;
    chart.appendChild(bar);
  });

  chartContainer.appendChild(chart);
}

document.addEventListener("DOMContentLoaded", renderSummary);
