import type { NextApiRequest, NextApiResponse } from "next";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

type GoFreshPayResponse = {
  Status?: string;
  Comment?: string;
  Reference?: string;
  Customer_Number?: string;
  Amount?: number;
  Currency?: string;
  Created_At?: string;
  Updated_At?: string;
  Transaction_id?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Méthode autorisée uniquement : POST
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const data: GoFreshPayResponse = req.body;

    console.log("Webhook GoFreshPay :", data);

    // 1. Vérifier la référence
    if (!data.Reference) {
      return res.status(400).json({
        error: "Reference manquante",
      });
    }

    // 2. Rechercher le paiement
    const q = query(
      collection(db, "paiements"),
      where("reference", "==", data.Reference)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return res.status(404).json({
        error: "Paiement introuvable",
      });
    }

    // 3. Récupérer le document
    const paymentDoc = snapshot.docs[0];

    // 4. Mettre à jour avec les données GoFreshPay
    await updateDoc(paymentDoc.ref, {
      Status: data.Status || null,
      Comment: data.Comment || null,
      Reference: data.Reference || null,
      Customer_Number: data.Customer_Number || null,
      Amount: data.Amount || null,
      Currency: data.Currency || null,
      Created_At: data.Created_At || null,
      Updated_At: data.Updated_At || null,
      Transaction_id: data.Transaction_id || null,
    });

    console.log(
      "Paiement mis à jour :",
      data.Reference,
      data.Status
    );

    return res.status(200).json({
      success: true,
    });
  } catch (error: any) {
    console.error(
      "Erreur webhook :",
      error?.message || error
    );

    return res.status(500).json({
      error: "Erreur lors du traitement du webhook",
    });
  }
}