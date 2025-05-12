import { NextApiRequest, NextApiResponse } from "next";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase"; // Assurez-vous d'avoir un fichier firebase.ts qui initialise Firebase



export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const querySnapshot = await getDocs(collection(db, "consultation"));
    const consultations = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.status(200).json(consultations);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la récupération des consultations" });
  }
}