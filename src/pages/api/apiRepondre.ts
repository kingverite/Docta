import type { NextApiRequest, NextApiResponse } from "next";
import { collection, query, where, getDocs, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { ficheNumero, statut, reponse, ordonnance, index } = req.body;

  if (!ficheNumero || !statut || !reponse || !ordonnance) {
    return res.status(400).json({ error: "Données manquantes" });
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
    const noww= Timestamp.now().toDate();

    const nouvelleReponse = {
      date: new Date().toISOString(),
      reponse,
      ordonnance,
    };

    if (req.method === "POST") {
      // Ajouter une nouvelle entrée
      historique.push(nouvelleReponse);
    } else if (req.method === "PUT") {

        
      if (typeof index !== "number" || index < 0 || index >= historique.length) {
        return res.status(400).json({ error: "Index invalide" });
      }
      // Modifier une entrée existante
      historique[index] = nouvelleReponse;
      const ancien = historique[index];
    const ancienDate = new Date(ancien.date);
    const diffHeures = (noww.getTime() - ancienDate.getTime()) / (1000 * 60 * 60);
    if (diffHeures > 24) {
        return res.status(403).json({ error: "Modification interdite après 24h" });
      }

    } else {
      return res.status(405).json({ error: "Méthode non autorisée" });
    }

    await updateDoc(docRef, { historique });
    return res.status(200).json({ success: true, historique });
  } catch (error) {
    console.error("Erreur API Repondre:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }




  
}