// =============================================================
// Firebase Configuration
// Replace the placeholder values below with your Firebase project config.
// You can find these in Firebase Console > Project Settings > General > Your apps
// =============================================================
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Enable offline persistence for better UX
try {
    db.enablePersistence({ synchronizeTabs: true });
} catch (err) {
    console.warn('Firestore persistence unavailable:', err.code);
}
