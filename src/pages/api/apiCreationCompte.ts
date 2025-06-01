import { NextApiRequest, NextApiResponse } from "next";
import { userRef } from "../../lib/firebase";

import bcrypt from "bcrypt";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Méthode non autorisée" });
  }
  try {
    console.log("req recue:", req.body);
  const { statut, password, pseudo, specialite } = req.body;

  if ( !statut || !password || !pseudo) {
    console.log("donnees manquante:", req.body);
    return res.status(400).json({ message: "Tous les champs sont requis" });
  }
  console.log("utilisaaaaaaaaa:", req.body);
  //return res.status(400).json({ message: "toookooooooos" });
  
    const userDoc = doc(userRef,pseudo);
    console.log("reference firestore cree:", userDoc);
    const docSnapshot=await getDoc(userDoc);
    console.log("dooccccccccccccccccccc:", docSnapshot.data());
if(docSnapshot.exists())
{
  console.log("le doc existe deja:", docSnapshot.data());
  return res.status(400).json({ message: "Le pseudo est déjà utilisé." });
  
}
else{
  console.log("le doc n'existe pas");
  const hashedPassword = await bcrypt.hash(password, 10);
  await setDoc(userDoc,{
    statut,
    pseudo,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
  });

  console.log("le doc cree avec succe");
    return res.status(201).json({ message: "Utilisateur enregistré avec succès." }); 

 
}
  
  } catch (error) {
    console.log("erreur:", error);
    return res.status(500).json({ message: "Erreur interne du serveur." });
  }
}
