/*// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore,collection } from "firebase/firestore";
import { getStorage } from "firebase/storage";
//import { getAuth } from "firebase/auth";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

//initialiser Firestore
const db = getFirestore(app);
const userRef=collection(db,"utilisateurs");
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const storage = getStorage(app);

//Exporter 
export{db};
export { userRef };
export { auth, provider };
export { storage };*/

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";

// 🔐 Configuration Firebase (via .env)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// ✅ Initialisation unique (évite erreurs multiples)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// ✅ Services globaux (OK côté serveur)
const db = getFirestore(app);
const storage = getStorage(app);
const userRef = collection(db, "utilisateurs");

// ❌ NE PAS exporter auth directement
// ✅ Fonction sécurisée pour client uniquement
export const getClientAuth = (): Auth => {
  if (typeof window === "undefined") {
    throw new Error("Firebase Auth doit être utilisé côté client uniquement");
  }
  return getAuth(app);
};

// ✅ Provider Google
export const provider = new GoogleAuthProvider();

// ✅ Exports
export { db, storage, userRef };
