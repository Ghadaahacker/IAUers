// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";

// Firebase config (حق مشروعك)
const firebaseConfig = {
  apiKey: "AIzaSyChH322jxj-b2_ZCWi71RRrzUG8O7pFkBE",
  authDomain: "iauers.firebaseapp.com",
  projectId: "iauers",
  storageBucket: "iauers.firebasestorage.app",
  messagingSenderId: "278163865940",
  appId: "1:278163865940:web:9112b4946c387ec39e88c1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
