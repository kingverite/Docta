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
  // =====================================================
  // ❌ MÉTHODE NON AUTORISÉE
  // =====================================================

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
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

    console.log("=================================");
    console.log("📥 DONNÉES REÇUES DU FRONTEND");
    console.log("Phone :", phone);
    console.log("Amount :", amount);
    console.log("Telecom :", telecom);
    console.log("Firstname :", firstname);
    console.log("Lastname :", lastname);
    console.log("Email :", email);
    console.log("=================================");

    // =====================================================
    // 2️⃣ VALIDATION
    // =====================================================

    if (!phone || !amount || !telecom) {
      return res.status(400).json({
        success: false,
        error: "Données manquantes",
      });
    }

    // =====================================================
    // 📱 VÉRIFICATION NUMÉRO RDC
    // Format attendu : 243XXXXXXXXX
    // =====================================================

    if (!/^243\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        error:
          "Numéro invalide. Format attendu : 243XXXXXXXXX",
      });
    }

    // =====================================================
    // 💰 CONVERSION DU MONTANT
    // =====================================================

    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
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
        success: false,
        error: "Opérateur télécom invalide",
      });
    }

    // =====================================================
    // 4️⃣ ANTI DOUBLE PAIEMENT
    // =====================================================

    console.log("🔎 Vérification d'une transaction existante...");

    const q = query(
      collection(db, "paiements"),
      where("phone", "==", phone),
      where("status", "==", "pending")
    );

    const existing = await getDocs(q);

    if (!existing.empty) {
      console.log(
        "⚠️ Une transaction pending existe déjà pour ce numéro."
      );

      return res.status(409).json({
        success: false,
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

    console.log("🆔 Référence générée :", reference);

    // =====================================================
    // 6️⃣ VÉRIFICATION VARIABLES ENVIRONNEMENT
    // =====================================================

    console.log("=================================");
    console.log("🔐 CONFIGURATION GOFRESHPAY");
    console.log(
      "Merchant ID présent :",
      !!process.env.GOFRESHPAY_MERCHANT_ID
    );
    console.log(
      "Merchant Secret présent :",
      !!process.env.GOFRESHPAY_MERCHANT_SECRET
    );
    console.log(
      "Callback URL :",
      process.env.GOFRESHPAY_CALLBACK_URL
    );
    console.log("=================================");

    // =====================================================
    // 7️⃣ ENVOYER LE PAIEMENT À GOFRESHPAY
    // =====================================================

    console.log("=================================");
    console.log("📤 REQUÊTE ENVOYÉE À GOFRESHPAY");
    console.log("📱 Numéro :", phone);
    console.log("💳 Méthode :", method);
    console.log("💰 Montant :", numericAmount);
    console.log("💵 Devise : CDF");
    console.log("🆔 Référence :", reference);
    console.log("=================================");

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
    // 8️⃣ RÉPONSE GOFRESHPAY
    // =====================================================

    const data = paymentRes.data;

    console.log("=================================");
    console.log("📥 RÉPONSE GOFRESHPAY");
    console.log(data);
    console.log("=================================");

    // =====================================================
    // 9️⃣ VÉRIFIER LA RÉFÉRENCE
    // =====================================================

    if (!data.Reference) {
      console.error(
        "❌ GoFreshPay n'a pas retourné de Reference."
      );

      return res.status(502).json({
        success: false,
        error:
          "Réponse GoFreshPay invalide : Reference manquante",
        details: data,
      });
    }

    // =====================================================
    // 🔟 NOM OPÉRATEUR
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
    // 1️⃣1️⃣ SAUVEGARDE FIRESTORE
    // =====================================================

    console.log("=================================");
    console.log("🔥 ENREGISTREMENT FIRESTORE");
    console.log("Collection : paiements");
    console.log("Reference :", data.Reference);
    console.log("=================================");

    await addDoc(collection(db, "paiements"), {
      phone,

      amount: numericAmount,

      telecom,

      operatorName,

      // 🔗 Référence GoFreshPay
      reference: data.Reference,

      status: "pending",

      statusLabel: "En attente",

      firstname: firstname || null,

      lastname: lastname || null,

      email: email || null,

      createdAt: new Date(),

      updatedAt: new Date(),
    });

    console.log("✅ Paiement enregistré dans Firestore.");

    // =====================================================
    // 1️⃣2️⃣ RÉPONSE AU FRONTEND
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
    // =====================================================
    // 🚨 LOGS TEMPORAIRES POUR DIAGNOSTIC
    // =====================================================

    console.error("=================================");
    console.error("❌ ERREUR PAIEMENT");
    console.error("Message :", error?.message);
    console.error("Code :", error?.code);
    console.error(
      "Status HTTP :",
      error?.response?.status
    );
    console.error(
      "Response GoFreshPay :",
      error?.response?.data
    );
    console.error(
      "Headers GoFreshPay :",
      error?.response?.headers
    );
    console.error("Erreur complète :", error);
    console.error("=================================");

    const status =
      error?.response?.status >= 400 &&
      error?.response?.status < 500
        ? error.response.status
        : 500;

    return res.status(status).json({
      success: false,

      error: "Erreur lors du paiement",

      details:
        error?.response?.data ||
        error?.message ||
        null,
    });
  }
}