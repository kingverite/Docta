import { NextApiRequest, NextApiResponse } from "next";

import { userRef } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
//import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("donnees :", req.method, req.body);
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Méthode non autorisée" });
  }

  const { pseudo, password } = req.body;

  if (!pseudo || !password) {
    return res.status(400).json({ error: "pseudo et mot de passe requis" });
  }

  try {
    console.log("donnees :", "KKKKKKKKKKKKKKKKKKKKKKKKKKK");

    // Vérifier si l'utilisateur existe
    const userDoc = doc(userRef, pseudo);
    const docSnapshot = await getDoc(userDoc);

    if (!docSnapshot.exists()) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    const userData = docSnapshot.data();
    console.log("donnees :", userData);

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, userData?.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Mot de passe incorrect" });
    }

    // Si authentifié avec succès
    return res.status(200).json({
      username: userData.pseudo,
      statut: userData.statut,
    });
    
  } catch (error) {
    //console.log("Erreur API :", error);
    console.error("Erreur trouvée", error);
    return res.status(500).json({ error: "Erreur interne du serveur" });
  }
}