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

// 🔹 Réponse GoFreshPay
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
  // ❌ Méthode non autorisée
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    // =====================================================
    // 1️⃣ RÉCUPÉRER LES DONNÉES DU FRONTEND
    // =====================================================

    const {
      phone,
      amount,
      telecom,
      firstname,
      lastname,
      email,
    } = req.body;

    // =====================================================
    // 2️⃣ VALIDATION
    // =====================================================

    if (!phone || !amount || !telecom) {
      return res.status(400).json({
        error: "Données manquantes",
      });
    }

    // 📱 Vérification numéro RDC
    if (!/^243\d{9}$/.test(phone)) {
      return res.status(400).json({
        error: "Numéro invalide. Format attendu : 243XXXXXXXXX",
      });
    }

    // 💰 Conversion du montant
    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      return res.status(400).json({
        error: "Montant invalide",
      });
    }

    // =====================================================
    // 3️⃣ CONVERSION OPÉRATEUR → GOFRESHPAY
    // =====================================================

    const methodMap: Record<string, string> = {
      MP: "mpesa",
      AM: "airtel",
      OM: "orange",
      AF: "afrimoney",
    };

    const method = methodMap[telecom];

    if (!method) {
      return res.status(400).json({
        error: "Opérateur télécom invalide",
      });
    }

    // =====================================================
    // 4️⃣ ANTI DOUBLE PAIEMENT
    // =====================================================

    const q = query(
      collection(db, "paiements"),
      where("phone", "==", phone),
      where("status", "==", "pending")
    );

    const existing = await getDocs(q);

    if (!existing.empty) {
      return res.status(409).json({
        error:
          "Une transaction est déjà en cours pour ce numéro",
      });
    }

    // =====================================================
    // 5️⃣ GÉNÉRER UNE RÉFÉRENCE UNIQUE
    // =====================================================

    const reference = `order_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}`;

    // =====================================================
    // 6️⃣ ENVOYER LE PAIEMENT À GOFRESHPAY
    // =====================================================

    const paymentRes =
      await axios.post<GoFreshPayResponse>(
        "https://api.gofreshpay.com/api/v1/gateway",
        {
          merchant_id:
            process.env.GOFRESHPAY_MERCHANT_ID,

          merchant_secrete:
            process.env.GOFRESHPAY_MERCHANT_SECRET,

          action: "debit",

          method,

          amount: String(numericAmount),

          currency: "CDF",

          customer_number: phone,

          reference,

          firstname: firstname || "Client",

          lastname: lastname || "Client",

          email: email || "client@example.com",

          callback_url:
            process.env.GOFRESHPAY_CALLBACK_URL,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },

          timeout: 30000,
        }
      );

    // =====================================================
    // 7️⃣ RÉPONSE GOFRESHPAY
    // =====================================================

    const data = paymentRes.data;

    console.log(
      "📥 Réponse GoFreshPay :",
      data
    );

    // =====================================================
    // 8️⃣ VÉRIFIER QUE GOFRESHPAY A RETOURNÉ UNE RÉFÉRENCE
    // =====================================================

    if (!data.Reference) {
      return res.status(502).json({
        error:
          "Réponse GoFreshPay invalide : Reference manquante",
      });
    }

    // =====================================================
    // 9️⃣ NOM OPÉRATEUR
    // =====================================================

    const operatorName =
      telecom === "AM"
        ? "Airtel"
        : telecom === "OM"
        ? "Orange"
        : telecom === "MP"
        ? "Mpesa"
        : "Afrimoney";

    // =====================================================
    // 🔟 SAUVEGARDE FIRESTORE
    // =====================================================

    await addDoc(collection(db, "paiements"), {
      phone,

      amount: numericAmount,

      telecom,

      operatorName,

      // 🔗 Très important pour le webhook
      reference: data.Reference,

      status: "pending",

      statusLabel: "En attente",

      firstname: firstname || null,

      lastname: lastname || null,

      email: email || null,

      createdAt: new Date(),

      updatedAt: new Date(),
    });

    // =====================================================
    // 1️⃣1️⃣ RÉPONSE AU FRONTEND
    // =====================================================

    return res.status(200).json({
      success: true,

      message:
        "Paiement initié. Veuillez confirmer sur votre téléphone.",

      reference: data.Reference,

      transactionId:
        data.Transaction_id || null,

      status:
        data.Status || "Pending",
    });
  } catch (error: any) {
    console.error(
      "❌ Erreur paiement GoFreshPay :",
      error?.response?.data ||
        error?.message ||
        error
    );

    return res.status(
      error?.response?.status >= 400 &&
        error?.response?.status < 500
        ? error.response.status
        : 500
    ).json({
      success: false,

      error: "Erreur lors du paiement",

      details:
        error?.response?.data || null,
    });
  }
}