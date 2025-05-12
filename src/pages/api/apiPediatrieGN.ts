import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Méthode non autorisée" });
  }

  try {
    const formData = req.body;
    const docRef = await addDoc(collection(db, "consultation"), formData);

    return res.status(200).json({ message: "Formulaire enregistré", id: docRef.id });
  } catch (error) {
    console.error("Erreur lors de l'enregistrement :", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
}