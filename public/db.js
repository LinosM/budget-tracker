let db;
// create a new db request for a "budget" database.
const request = window.indexedDB.open('budget', 1);

request.onupgradeneeded = function (evt) {
  const db = evt.target.result;
  const pending = db.createObjectStore('pending', {
    autoIncrement: true
  })

  pending.createIndex("pendingIndex", "pending");
};

request.onsuccess = function (evt) {
  db = request.result;
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function (evt) {
  console.log(`Error: ${evt.target.errorCode}`)
};

// Saves transaction to db
function saveRecord(record) {
  const transaction = db.transaction(["pending"], "readwrite");
  const pendingStore = transaction.objectStore('pending');
  pendingStore.add(record)
}

// Adds pending offline db to app then clears on succession
function checkDatabase() {
  const transaction = db.transaction(["pending"], "readwrite");
  const pendingStore = transaction.objectStore('pending');
  const getAll = pendingStore.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((res) => res.json())
        .then(() => {
          const transaction = db.transaction(["pending"], "readwrite");
          const pendingStore = transaction.objectStore('pending');
          pendingStore.clear();
        });
    }
  };
}

// listen for app coming back online
window.addEventListener('online', checkDatabase);
