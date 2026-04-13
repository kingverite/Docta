import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";

// 🔹 Type du callback SerdiPay
type CallbackData = {
  status?: number;
  message?: string;
  payment?: {
    status?: "success" | "failed";
    transactionId?: string;
    sessionId?: string;
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // ❌ méthode non autorisée
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const data: CallbackData = req.body;

    // 🔍 LOG IMPORTANT (debug)
    console.log("🔔 CALLBACK REÇU :", JSON.stringify(data, null, 2));

    // 🔐 VALIDATION STRUCTURE
    const status = data?.payment?.status;
    const transactionId = data?.payment?.transactionId;

    if (!status || !transactionId) {
      console.error("❌ Callback invalide :", data);
      return res.status(400).json({ error: "Invalid callback data" });
    }

    // 🔍 Rechercher transaction dans Firestore
    const q = query(
      collection(db, "paiements"),
      where("transactionId", "==", transactionId)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.error("❌ Transaction introuvable :", transactionId);
      return res.status(404).json({ error: "Transaction not found" });
    }

    // 🔄 Mise à jour Firestore
    const updatePromises = snapshot.docs.map((docu) => {
      return updateDoc(docu.ref, {
        status, // success ou failed
        statusLabel: status === "success" ? "Réussi" : "Échoué",
        updatedAt: new Date(),
      });
    });

    await Promise.all(updatePromises);

    console.log(
      `✅ Transaction ${transactionId} mise à jour avec status: ${status}`
    );

    // ✅ IMPORTANT : toujours répondre 200
    return res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error("🔥 ERREUR CALLBACK :", error.message);

    return res.status(500).json({
      error: "Callback error",
    });
  }
}