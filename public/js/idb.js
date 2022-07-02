//create variable to hold db connection
let db;

//establish connection to IndexedDb database called "budget_tracker" and set it to version 1
const request =  indexedDB.open('budget_tracker', 1);

request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('new_transaction', {autoIncrement: true });
};

request.onsuccess = function(event) {
   //when db is successfully created with it's pbject store (from onupgradeneeded event above) or simply established a connection, save reference to db in global variable
   db = event.target.result;
   
   //check if app is online, if yes run uploadTransactions() to send all local data to api
   if(navigator.online) {
    uploadTransactions();
   }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
}; 

//this function will be executed if we attempt to submit transactions and there's no internet connection
function saveTransaction(record) {
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    const transactionObjectStore = transaction.objectStore('new_transaction');

    transactionObjectStore.add(record);
};

function uploadTransactions() {
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    const transactionObjectStore = transaction.objectStore('new_transaction');
    const getAll = transactionObjectStore.getAll();

    getAll.onsuccess = function () {
        //if there is data in indexedDB's store, send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if(serverResponse.message) {
                    throw new Error (serverResponse);
                }
                const transaction = db.transaction(['new_transaction'], 'readwrite');
                const transactionObjectStore = transaction.objectStore('new_transaction');
                transactionObjectStore.clear();

                alert('All saved transactions have been submitted');
            })
            .catch(err => {
                console.log(err);
            });
        }
    }
};

//listen for app going back online
window.addEventListener('online', uploadTransactions);