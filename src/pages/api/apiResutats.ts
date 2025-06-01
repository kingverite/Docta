// pages/api/apiResultats.ts
import { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/firebaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const username = req.query.username as string;

  if (!username) {
    return res.status(400).json({ error: "Nom d'utilisateur manquant." });
  }

  try {
    const collections = await db.listCollections();
    let results: any[] = [];

    for (const collectionRef of collections) {
      const querySnapshot = await db
        .collection(collectionRef.id)
        .where("username", "==", username)
        .get();

      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        statutCollection: collectionRef.id,
      }));

      results.push(...data);
    }

    res.status(200).json(results);
  } catch (error) {
    console.error("Erreur Firestore:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des données.", message: (error as Error).message });
  }
}