
import { getRecords, addRecord } from "./state.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("App loaded ");

  const records = getRecords();
  console.log("Loaded records:", records);

  // Example: Add a sample record (for testing)
  // remove this after confirming localStorage works
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

  function getStoredData() {
    return JSON.parse(localStorage.getItem("studentfinancestracker-data")) || [];
  }

  function saveData(data) {
    localStorage.setItem("studentfinancestracker-data", JSON.stringify(data));
  }

  function renderRecords() {
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

 renderRecords();

  tableBody.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-btn")) {
      const index = e.target.dataset.index;
      console.log("Deleting record at index:", index);

      const storedData = getStoredData();
      storedData.splice(index, 1); // remove the selected record
      saveData(storedData);
      renderRecords(); // refresh table

      console.log("Record deleted ❌");
    }
  });
 
 const form = document.getElementById("transaction-form");
 form.addEventListener("submit", (e) => {
      console.log("Form submitted 🎀");

  e.preventDefault();
  
  // ⬇️ put the newRecord code here!
  const newRecord = {
    description: document.getElementById("title").value,
    amount: parseFloat(document.getElementById("amount").value),
    category: document.getElementById("category").value,
    date: document.getElementById("date").value,
    id: `rec_${Date.now()}`
  };

  // Save to localStorage
  const records = JSON.parse(localStorage.getItem("studentfinancestracker-data")) || [];
  records.push(newRecord);
  localStorage.setItem("studentfinancestracker-data", JSON.stringify(records));

  // Update the table instantly
  renderRecords();

  // Clear form after saving
  form.reset();

  console.log("New record added ✅", newRecord);
 });
});
