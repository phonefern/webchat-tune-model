// Import Firebase functions (v9 modular)
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Firestore import
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from 'firebase/auth';

// Firebase configuration (replace with your config)
const firebaseConfig = {
  apiKey: "AIzaSyCJ21Qs-EgWknnIopczeVi3xFZ_a2VgHBI",
  authDomain: "llm-chat-fbe62.firebaseapp.com",
  projectId: "llm-chat-fbe62",
  storageBucket: "llm-chat-fbe62.appspot.com",
  messagingSenderId: "101826499668",
  appId: "1:101826499668:web:78aed7eb0b9c40db0f49c1",
  measurementId: "G-T7WCGZYTNK",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);
const auth = getAuth(app);
// Initialize Analytics (only if supported)
let analytics;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { db, analytics, auth };
