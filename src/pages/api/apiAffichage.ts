import type { NextApiRequest, NextApiResponse } from "next";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { statut2 } = req.query;
  try {

    const q = query(
      collection(db, "consultation"),
      where("specialite", "==", statut2)
    );

    const querySnapshot = await getDocs(q);

    const consultations = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json(consultations);

  } catch (error) {
    console.error("Erreur lors de la récupération des consultations:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
}