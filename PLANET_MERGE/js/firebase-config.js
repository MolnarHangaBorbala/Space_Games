// ------- FIREBASE LEADERBOARD (Claude) ----------
const firebaseConfig = {
    apiKey: "AIzaSyB51eR9v4KvC8MdwBcJ68IXIdjou1EeXa0",
    authDomain: "planet-merge-game.firebaseapp.com",
    databaseURL: "https://planet-merge-game-default-rtdb.europe-west1.firebasedatabase.app/",
    projectId: "planet-merge-game",
    storageBucket: "planet-merge-game.firebasestorage.app",
    messagingSenderId: "900875497215",
    appId: "1:900875497215:web:9edf2c0b3acfa6d9c3a6ca"
};

let database;
let isFirebaseInitialized = false;

function initializeFirebase() {
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        database = firebase.database();
        isFirebaseInitialized = true;
        console.log('Firebase initialized successfully');
        return true;
    } catch (error) {
        console.error('Failed to initialize Firebase:', error);
        isFirebaseInitialized = false;
        return false;
    }
}

initializeFirebase();