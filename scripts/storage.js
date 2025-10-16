const STORAGE_KEY = "studentfinancestracker-data";

// Load records from localStorage
export function loadData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error loading data:", error);
    return [];
  }
}

// Save records to localStorage
export function saveData(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    console.log("Data saved successfully.");
  } catch (error) {
    console.error("Error saving data:", error);
  }
}

// Optional: Clear all data (for testing or reset button)
export function clearData() {
  localStorage.removeItem(STORAGE_KEY);
}
