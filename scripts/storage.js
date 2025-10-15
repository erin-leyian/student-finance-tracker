const STORAGE_KEY = "studentfinancestracker-data";

export function loadData() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

export function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearData() {
    localStorage.removeItem(STORAGE_KEY);
}

