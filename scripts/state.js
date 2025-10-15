import { loadData, saveData }  from "./storage.js";

let records = loadData();

export function getRecords() {
    return records;
}

export function addRecord(record) {
    record.id = `rec_${Date.now()}`;
    record.createdAt = new Date().toISOString();
    records.updatedAt = record.createdAt;

    records.push(record);
    saveData(records);
}

export function deleteRecord(id) {
    records = records.filter(r => r.id !== id);
    saveData(records);
}

export function updateRecord(id, updatedData) {
    const record = records.find(r => r.id === id);
    if (record) {
        Object.assign(record, updatedData);
        record.updatedAt = new Date().toISOString();
        saveData(records);
    }
}
