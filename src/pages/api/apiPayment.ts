import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

import { db } from "@/lib/firebase";

import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

type ProviderResponse = {
  Status?: string;
  Comment?: string;
  Reference?: string;
  Customer_Number?: string;
  Amount?: number | string;
  Currency?: string;
  Transaction_id?: string;
  Created_At?: string;
  Updated_At?: string;
};

type VerifyResponse = {
  Reference?: string;
  Status?: string;
  Trans_Status?: string;
  Trans_Status_Description?: string;
  Transaction_id?: string;
  Financial_Institution_id?: string;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  reference?: string;
  transactionId?: string | null;
  paymentId?: string;
  status?: string;
};

const DIGITALOCEAN_API_URL =
  process.env.DIGITALOCEAN_API_URL?.replace(/\/+$/, "") || "";

const INTERNAL_API_SECRET =
  process.env.INTERNAL_API_SECRET || "";

const CALLBACK_URL =
  process.env.GOFRESHPAY_CALLBACK_URL || "";

const METHODS: Record<string, string> = {
  MP: "mpesa",
  AM: "airtel",
  OM: "orange",
  AF: "afrimoney",
};

function generateReference(): string {
  return `order_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 8)}`;
}

function validatePhone(
  phone: string,
  telecom: string
): boolean {
  if (telecom === "MP") {
    return /^243\d{9}$/.test(phone);
  }

  if (
    telecom === "AM" ||
    telecom === "OM" ||
    telecom === "AF"
  ) {
    return /^0\d{9}$/.test(phone);
  }

  return false;
}

function normalizeStatus(status?: string): string {
  if (status === "Successful") return "success";
  if (status === "Failed") return "failed";
  return "pending";
}

async function verifyPendingPayment(reference: string) {
  const response = await axios.post<{
    success?: boolean;
    data?: VerifyResponse;
  }>(
    `${DIGITALOCEAN_API_URL}/api/mobile-money/verify`,
    { reference },
    {
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": INTERNAL_API_SECRET,
      },
      timeout: 30000,
    }
  );

  if (!response.data.success || !response.data.data) {
    throw new Error("Réponse de vérification invalide.");
  }

  return response.data.data;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    return res.status(405).json({
      success: false,
      error: "Méthode non autorisée.",
    });
  }

  try {
    if (
      !DIGITALOCEAN_API_URL ||
      !INTERNAL_API_SECRET ||
      !CALLBACK_URL
    ) {
      return res.status(500).json({
        success: false,
        error: "Configuration Mobile Money incomplète.",
      });
    }

    const {
      phone,
      amount,
      telecom,
      firstname,
      lastname,
      email,
    } = req.body ?? {};

    if (
      typeof phone !== "string" ||
      typeof telecom !== "string"
    ) {
      return res.status(400).json({
        success: false,
        error: "Numéro et opérateur obligatoires.",
      });
    }

    const normalizedPhone = phone.replace(/\s+/g, "").trim();

    if (!validatePhone(normalizedPhone, telecom)) {
      return res.status(400).json({
        success: false,
        error:
          telecom === "MP"
            ? "Pour M-Pesa, utilisez le format 243XXXXXXXXX."
            : "Pour cet opérateur, utilisez le format 0XXXXXXXXX.",
      });
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Montant invalide.",
      });
    }

    if (!METHODS[telecom]) {
      return res.status(400).json({
        success: false,
        error: "Opérateur non pris en charge.",
      });
    }

    // Vérifier toutes les transactions en attente de ce numéro.
    const pendingQuery = query(
      collection(db, "paiements"),
      where("phone", "==", normalizedPhone),
      where("status", "==", "pending")
    );

    const pendingSnapshot = await getDocs(pendingQuery);

    for (const pendingDoc of pendingSnapshot.docs) {
      const pendingData = pendingDoc.data();
      const pendingReference = pendingData.reference;

      if (
        typeof pendingReference !== "string" ||
        !pendingReference
      ) {
        return res.status(409).json({
          success: false,
          error:
            "Une transaction en attente doit être vérifiée manuellement.",
        });
      }

      let verified: VerifyResponse;

      try {
        verified = await verifyPendingPayment(pendingReference);
      } catch {
        return res.status(409).json({
          success: false,
          reference: pendingReference,
          error:
            "Impossible de vérifier la transaction précédente. Aucun nouveau paiement ne sera lancé.",
        });
      }

      if (verified.Reference !== pendingReference) {
        return res.status(409).json({
          success: false,
          error:
            "La référence retournée par FreshPay ne correspond pas à la transaction.",
        });
      }

      const finalStatus = normalizeStatus(verified.Trans_Status);

      await updateDoc(pendingDoc.ref, {
        status: finalStatus,
        statusLabel:
          finalStatus === "success"
            ? "Paiement réussi"
            : finalStatus === "failed"
              ? "Paiement échoué"
              : "En attente",
        Status: verified.Status || null,
        Trans_Status: verified.Trans_Status || null,
        Trans_Status_Description:
          verified.Trans_Status_Description || null,
        Transaction_id: verified.Transaction_id || null,
        Financial_Institution_id:
          verified.Financial_Institution_id || null,
        updatedAt: serverTimestamp(),
      });

      if (finalStatus !== "failed") {
        return res.status(409).json({
          success: false,
          reference: pendingReference,
          error:
            finalStatus === "success"
              ? "Un paiement a déjà réussi pour ce numéro."
              : "Une transaction est encore en cours pour ce numéro.",
        });
      }
    }

    const reference = generateReference();

    // Créer le document avant l'appel fournisseur afin que le callback
    // puisse retrouver la transaction.
    const paymentDoc = await addDoc(
      collection(db, "paiements"),
      {
        phone: normalizedPhone,
        firstname: firstname || null,
        lastname: lastname || null,
        email: email || null,
        amount: numericAmount,
        currency: "CDF",
        telecom,
        operatorName: {
          MP: "M-Pesa",
          AM: "Airtel Money",
          OM: "Orange Money",
          AF: "Afrimoney",
        }[telecom],
        reference,
        status: "pending",
        statusLabel: "En attente",
        provider: "FreshPay",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    );

    try {
      const response = await axios.post<{
        success?: boolean;
        data?: ProviderResponse;
        error?: string;
      }>(
        `${DIGITALOCEAN_API_URL}/api/mobile-money/payment`,
        {
          phone: normalizedPhone,
          amount: numericAmount,
          telecom,
          firstname: firstname || "Client",
          lastname: lastname || "Client",
          email: email || "client@example.com",
          reference,
          callback_url: CALLBACK_URL,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-Internal-Secret": INTERNAL_API_SECRET,
          },
          timeout: 35000,
        }
      );

      const providerData = response.data.data;

      if (
        !response.data.success ||
        !providerData?.Reference ||
        providerData.Reference !== reference
      ) {
        throw new Error("Réponse d'initialisation FreshPay invalide.");
      }

      await updateDoc(paymentDoc, {
        reference: providerData.Reference,
        Status: providerData.Status || null,
        Comment: providerData.Comment || null,
        Customer_Number: providerData.Customer_Number || null,
        Currency: providerData.Currency || "CDF",
        Transaction_id: providerData.Transaction_id || null,
        Created_At: providerData.Created_At || null,
        Updated_At: providerData.Updated_At || null,
        updatedAt: serverTimestamp(),
      });

      return res.status(200).json({
        success: true,
        message:
          "Demande envoyée. Veuillez confirmer le paiement sur votre téléphone.",
        reference: providerData.Reference,
        transactionId: providerData.Transaction_id || null,
        paymentId: paymentDoc.id,
        status: "pending",
      });
    } catch (error) {
      /*
       * Une erreur réseau ne prouve pas que FreshPay n'a pas reçu
       * la demande. On conserve donc le statut pending pour éviter
       * de déclencher un doublon sans vérification.
       */
     let errorDetails: string | number = "Erreur inconnue";

if (error instanceof Error) {
  errorDetails = error.message;
}

if (
  typeof error === "object" &&
  error !== null &&
  "response" in error
) {
  const response = (
    error as {
      response?: {
        status?: number;
      };
    }
  ).response;

  if (response?.status) {
    errorDetails = response.status;
  }
}

console.error(
  "Erreur d'initialisation Mobile Money :",
  errorDetails
);

      return res.status(502).json({
        success: false,
        reference,
        paymentId: paymentDoc.id,
        error:
          "Le résultat de l'initialisation est incertain. Vérifiez le statut avant de réessayer.",
      });
    }
  } catch (error) {
    console.error(
      "Erreur apiPayment :",
      error instanceof Error ? error.message : "Erreur inconnue"
    );

    return res.status(500).json({
      success: false,
      error: "Une erreur est survenue lors du paiement.",
    });
  }
}