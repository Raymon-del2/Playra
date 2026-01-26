import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyDhKGMxI4qLxgvxoYDlcdAXx_FgbW1dDC0",
    authDomain: "playra-1.firebaseapp.com",
    projectId: "playra-1",
    storageBucket: "playra-1.firebasestorage.app",
    messagingSenderId: "658342594543",
    appId: "1:658342594543:web:646125c0a9ebe8f06b581a",
    measurementId: "G-M1EQQZ21W9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
