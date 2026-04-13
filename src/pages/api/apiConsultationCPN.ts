import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../lib/firebase";
import { doc, setDoc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Méthode non autorisée" });
  }

  try {
    const formData = req.body;
    const email = formData.email;

    const docRef = doc(db, "consultationCPN", email);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      await updateDoc(docRef, {
        consultations: arrayUnion(formData)
      });
    } else {
      await setDoc(docRef, {
        email: email,
        consultations: [formData]
      });
    }

    return res.status(200).json({ message: "Formulaire enregistré" });

  } catch (error) {
    console.error("Erreur lors de l'enregistrement :", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
}