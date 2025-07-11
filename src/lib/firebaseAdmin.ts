import admin from "firebase-admin";


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