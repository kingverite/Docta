import { NextApiRequest, NextApiResponse } from "next";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const statut = req.query.statut as string;

  if (!statut) {
    return res.status(400).json({ error: "Statut manquant dans la requête." });
  }

  try {
    console.log("cooookies:", statut);
    const querySnapshot = await getDocs(collection(db, statut));
    const consultations = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.status(200).json(consultations);
  } catch (error) {
    console.error("Erreur lors de la récupération des consultations:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
}