import { initializeApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const env = import.meta.env;

export const firebaseConfig: FirebaseOptions = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyDvno110yawAqkbYd5pSOVTquDJY5ILjLc",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "couple-youngwoo-jisun-20260205.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "couple-youngwoo-jisun-20260205",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "couple-youngwoo-jisun-20260205.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "365911720629",
  appId: env.VITE_FIREBASE_APP_ID || "1:365911720629:web:5c84c8755b6e90bcbaf4fc",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || "G-9REC1WL612",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
export const auth = getAuth(firebaseApp);
