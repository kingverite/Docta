import { NextApiRequest, NextApiResponse } from "next";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { statut, ficheNumero } = req.query;

  if (!statut || !ficheNumero) {
    return res.status(400).json({ error: "Paramètres manquants." });
  }

  try {
    const q = query(
      collection(db, String(statut)),
      where("ficheNumero", "==", ficheNumero) // ici ficheNumero doit être stocké comme string dans Firestore
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return res.status(404).json({ error: "Fiche non trouvée." });
    }

    const docData = snapshot.docs[0].data();
    const historique = docData.historique || [];
    return res.status(200).json(historique);
  } catch (error) {
    console.error("Erreur API historique:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}