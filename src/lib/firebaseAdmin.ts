import admin from "firebase-admin";

console.log("PROJECT ID:", process.env.FIREBASE_ADMIN_PROJECT_ID);
console.log("CLIENT_EMAIL:", process.env.FIREBASE_ADMIN_CLIENT_EMAIL);
console.log("PRIVATE_KEY:", process.env.FIREBASE_ADMIN_PRIVATE_KEY);
console.log("STORAGE_BUCKET:", process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);

if (!admin.apps.length) {
  
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    //storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

const db = admin.firestore();


export { db };