// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDyPxGcDGdAaqh3cAv_QKiJPAnJq8ZvPf8",
    authDomain: "granville-inventory.firebaseapp.com",
    projectId: "granville-inventory",
    storageBucket: "granville-inventory.appspot.com",
    messagingSenderId: "838200974011",
    appId: "1:838200974011:web:84f6f9d7d927cadf27679e",
    measurementId: "G-19Q23TNKVL"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

// Elements
const loginButton = document.getElementById('login');
const logoutButton = document.getElementById('logout');
const adminSection = document.getElementById('admin');
const itemForm = document.getElementById('itemForm');
const inventoryTable = document.getElementById('inventoryTable').getElementsByTagName('tbody')[0];

// Google Sheets API setup
const SHEET_ID = '1ChFdbTCw4JYb3w0YI-gmG1VJ8oFOYsAP6rPkekvlJZo';
const API_KEY = 'YOUR_GOOGLE_API_KEY';
const SHEET_NAME = 'Sheet1'; // Replace with your sheet name

function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

function initClient() {
    gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
    }).then(() => {
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    });
}

function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        adminSection.style.display = 'block';
        loginButton.style.display = 'none';
        logoutButton.style.display = 'block';
        listInventoryItems();
    } else {
        adminSection.style.display = 'none';
        loginButton.style.display = 'block';
        logoutButton.style.display = 'none';
    }
}

function handleAuthClick() {
    auth.signInWithPopup(provider).catch((error) => {
        console.error('Error during login:', error);
    });
}

function handleSignoutClick() {
    auth.signOut();
}

function listInventoryItems() {
    gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: SHEET_NAME
    }).then((response) => {
        const range = response.result;
        if (range.values.length > 0) {
            range.values.forEach((row, index) => {
                if (index > 0) { // Skip header row
                    const newRow = inventoryTable.insertRow();
                    newRow.insertCell().innerText = row[0];
                    newRow.insertCell().innerText = row[1];
                    newRow.insertCell().innerText = row[2];
                    newRow.insertCell().innerHTML = row[3] ? `<img src="${row[3]}" alt="Item Image">` : '';
                    newRow.insertCell().innerText = row[4];
                    const claimButton = document.createElement('button');
                    claimButton.innerText = row[4] === 'Available' ? 'Claim' : 'Claimed';
                    claimButton.disabled = row[4] !== 'Available';
                    claimButton.addEventListener('click', () => claimItem(index + 1));
                    newRow.insertCell().appendChild(claimButton);
                }
            });
        }
    }).catch((error) => {
        console.error('Error fetching data from Google Sheets:', error);
    });
}

function claimItem(rowIndex) {
    const range = `${SHEET_NAME}!E${rowIndex}`;
    gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: range,
        valueInputOption: 'RAW',
        resource: {
            values: [['Claimed']]
        }
    }).then(() => {
        listInventoryItems(); // Refresh the list
    }).catch((error) => {
        console.error('Error updating item status:', error);
    });
}

itemForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('name').value;
    const quantity = document.getElementById('quantity').value;
    const description = document.getElementById('description').value;
    const image = document.getElementById('image').value || '';
    const status = 'Available';
    gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: SHEET_NAME,
        valueInputOption: 'RAW',
        resource: {
            values: [[name, quantity, description, image, status]]
        }
    }).then(() => {
        listInventoryItems(); // Refresh the list
        itemForm.reset();
    }).catch((error) => {
        console.error('Error adding new item:', error);
    });
});

// Event Listeners
loginButton.addEventListener('click
