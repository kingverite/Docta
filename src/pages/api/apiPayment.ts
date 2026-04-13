import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";

// 🔹 Types
type SerdiTokenResponse = {
  access_token: string;
};

type SerdiPaymentResponse = {
  transactionId?: string;
  message?: string;
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
    const { phone, amount, telecom } = req.body;

    // 🔍 1. VALIDATION
    if (!phone || !amount || !telecom) {
      return res.status(400).json({ error: "Données manquantes" });
    }

    if (!/^243\d{9}$/.test(phone)) {
      return res.status(400).json({ error: "Numéro invalide (243...)" });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({ error: "Montant invalide" });
    }

    // 🚫 2. ANTI DOUBLE PAIEMENT (optionnel mais recommandé)
    const q = query(
      collection(db, "paiements"),
      where("phone", "==", phone),
      where("status", "==", "pending")
    );

    const existing = await getDocs(q);

    if (!existing.empty) {
      return res.status(409).json({
        error: "Une transaction est déjà en cours pour ce numéro",
      });
    }

    // 🔐 3. RÉCUPÉRER TOKEN
    const tokenRes = await axios.post<SerdiTokenResponse>(
      "https://serdipay.com/api/public-api/v1/merchant/get-token",
      {
        email: process.env.SERDI_EMAIL,
        password: process.env.SERDI_PASSWORD,
      }
    );

    const token = tokenRes.data.access_token;

    // 💳 4. PAIEMENT
    const paymentRes = await axios.post<SerdiPaymentResponse>(
      "https://serdipay.com/api/public-api/v1/merchant/payment-client",
      {
        api_id: process.env.API_ID,
        api_password: process.env.API_PASSWORD,
        merchantCode: process.env.MERCHANT_CODE,
        merchant_pin: process.env.MERCHANT_PIN,
        clientPhone: phone,
        amount: Number(amount),
        currency: "CDF",
        telecom, // AM / OM / MP / AF
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // 🔍 Debug (très utile)
    console.log("SerdiPay response:", paymentRes.data);

    // 🆔 5. TRANSACTION ID (obligatoire)
    const transactionId = paymentRes.data.transactionId;

    if (!transactionId) {
      throw new Error("transactionId manquant dans la réponse SerdiPay");
    }

    // 🏷️ 6. NOM OPÉRATEUR (pour UI)
    const operatorName =
      telecom === "AM"
        ? "Airtel"
        : telecom === "OM"
        ? "Orange"
        : telecom === "MP"
        ? "Mpesa"
        : "Afrimoney";

    // 💾 7. SAUVEGARDE FIRESTORE
    await addDoc(collection(db, "paiements"), {
      phone,
      amount: Number(amount),
      telecom,
      operatorName,
      transactionId,
      status: "pending",
      statusLabel: "En attente",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // ✅ 8. RÉPONSE FRONTEND
    return res.status(200).json({
      message: "Paiement initié. Confirmez sur votre téléphone.",
      transactionId,
    });
  } catch (error: any) {
    console.error(
      "Erreur paiement:",
      error?.response?.data || error.message
    );

    return res.status(500).json({
      error: "Erreur lors du paiement",
      details: error?.response?.data || null,
    });
  }
}