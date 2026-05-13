import { initializeApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const env = import.meta.env;

const requiredFirebaseEnv = {
  VITE_FIREBASE_API_KEY: env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET: env.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID: env.VITE_FIREBASE_APP_ID,
};

export const missingFirebaseEnv = Object.entries(requiredFirebaseEnv)
  .filter(([, value]) => !String(value || "").trim())
  .map(([key]) => key);

export const hasFirebaseConfig = missingFirebaseEnv.length === 0;

export const firebaseConfig: FirebaseOptions = {
  apiKey: env.VITE_FIREBASE_API_KEY || "",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: env.VITE_FIREBASE_APP_ID || "",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || "",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
export const auth = getAuth(firebaseApp);
