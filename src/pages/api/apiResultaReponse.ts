import type { NextApiRequest, NextApiResponse } from "next";
import { collection, query, where, getDocs, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { ficheNumero, statut, reponse, ordonnance, index } = req.body;

  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Seule la méthode PUT est autorisée" });
  }

  if (!ficheNumero || !statut || !reponse || !ordonnance || typeof index !== "number") {
    return res.status(400).json({ error: "Données manquantes ou index invalide" });
  }

  try {
    const q = query(
      collection(db, statut),
      where("ficheNumero", "==", ficheNumero)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return res.status(404).json({ error: "Fiche introuvable" });
    }

    const docRef = snapshot.docs[0].ref;
    const data = snapshot.docs[0].data();
    const historique = Array.isArray(data.historique) ? data.historique : [];

    if (index < 0 || index >= historique.length) {
      return res.status(400).json({ error: "Index en dehors des limites" });
    }

    const now = Timestamp.now().toDate();
    const cible = historique[index];
    const dateCible = new Date(cible.date);
    const diffHeures = (now.getTime() - dateCible.getTime()) / (1000 * 60 * 60);

    //if (diffHeures > 24) {
     
    //return res.status(403).json({ error: "Ajout interdit après 24h" });
    //}

    // Assurer que le champ "suivi" existe et est un tableau
    if (!Array.isArray(cible.suivi)) {
      cible.suivi = [];
    }

    // Ajouter la nouvelle réponse dans le champ suivi[]
    cible.suivi.push({
      date: new Date().toISOString(),
      resultat1:reponse,
      resultat2:ordonnance,
    });

    // Remplacer l’entrée modifiée dans le tableau historique
    historique[index] = cible;

    await updateDoc(docRef, { historique });

    return res.status(200).json({ success: true, historique });
  } catch (error) {
    console.error("Erreur API ResultaReponse (PUT):", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}