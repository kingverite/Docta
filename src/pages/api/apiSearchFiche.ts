import type { NextApiRequest, NextApiResponse } from "next";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";



export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { statut, ficheNumero } = req.query;

  if (!statut || typeof statut !== "string") {
    return res.status(400).json({ error: "Le paramètre 'statut' est requis et doit être une chaîne." });
  }

  if (!ficheNumero || typeof ficheNumero !== "string") {
    return res.status(400).json({ error: "Le paramètre 'ficheNumero' est requis et doit être une chaîne." });
  }

  try {
    const collectionRef = collection(db, statut);

    // Filtrage exact sur ficheNumero
    const q = query(collectionRef, where("ficheNumero", "==", ficheNumero));

    const querySnapshot = await getDocs(q);

    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(results);
  } catch (error) {
    console.error("Erreur lors de la requête Firestore:", error);
    return res.status(500).json({ error: "Erreur serveur lors de la récupération des données" });
  }
}