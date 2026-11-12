import type {
  NextApiRequest,
  NextApiResponse,
} from "next";

import axios from "axios";
import crypto from "crypto";
import { db } from "@/lib/firebaseAdmin";

// =========================================
// TYPES
// =========================================

interface CardPaymentRequest {
  amount: number;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
}

interface CardPaymentResponse {
  success: boolean;
  error?: string;
  reference?: string;
  checkoutUrl?: string;
}

interface FreshPayCardResponse {
  status?: string;
  data?: {
    links?: string;
    transaction_uuid?: string;
  };
}

interface AxiosLikeError {
  isAxiosError: true;
  response?: {
    status?: number;
  };
  code?: string;
}

// Vérification Axios compatible avec unknown
function isAxiosLikeError(
  error: unknown
): error is AxiosLikeError {
  if (
    typeof error !== "object" ||
    error === null
  ) {
    return false;
  }

  return (
    "isAxiosError" in error &&
    (error as { isAxiosError?: unknown })
      .isAxiosError === true
  );
}

// =========================================
// API HANDLER
// =========================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CardPaymentResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);

    return res.status(405).json({
      success: false,
      error: "Méthode non autorisée.",
    });
  }

  try {
    const {
      amount,
      firstname,
      lastname,
      email,
      phone,
      address,
      city,
      country,
    } = req.body as CardPaymentRequest;

    // =========================================
    // 1. VALIDATION DU MONTANT
    // =========================================

    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount < 1 ||
      !Number.isSafeInteger(
        Math.round(numericAmount * 100)
      )
    ) {
      return res.status(400).json({
        success: false,
        error: "Le montant minimum est de 1 USD.",
      });
    }

    // =========================================
    // 2. VALIDATION DES INFORMATIONS CLIENT
    // =========================================

    const fields = {
      firstname,
      lastname,
      email,
      phone,
      address,
      city,
      country,
    };

    for (const [key, value] of Object.entries(fields)) {
      if (
        typeof value !== "string" ||
        !value.trim()
      ) {
        return res.status(400).json({
          success: false,
          error: `Le champ ${key} est obligatoire.`,
        });
      }
    }

    const cleanFirstname = firstname.trim();
    const cleanLastname = lastname.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanAddress = address.trim();
    const cleanCity = city.trim();
    const cleanCountry = country.trim().toUpperCase();

    if (
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)
    ) {
      return res.status(400).json({
        success: false,
        error: "Adresse e-mail invalide.",
      });
    }

    if (
      !/^[\d+][\d\s\-()]{4,19}$/.test(cleanPhone)
    ) {
      return res.status(400).json({
        success: false,
        error: "Numéro de téléphone invalide.",
      });
    }

    if (!/^[A-Z]{2}$/.test(cleanCountry)) {
      return res.status(400).json({
        success: false,
        error: "Code pays invalide. Utilisez deux lettres ISO.",
      });
    }

    if (["US", "CA"].includes(cleanCountry)) {
      return res.status(400).json({
        success: false,
        error:
          "Ce formulaire nécessite des champs supplémentaires pour les paiements depuis les États-Unis ou le Canada.",
      });
    }

    // =========================================
    // 3. CONFIGURATION SERVEUR
    // =========================================

    const SITE_URL = process.env.SITE_URL;

    // Utilisation de la variable déjà configurée
    const DIGITALOCEAN_API_URL =
      process.env.DIGITALOCEAN_API_URL;

    const INTERNAL_API_SECRET =
      process.env.INTERNAL_API_SECRET;

    if (
      !SITE_URL ||
      !DIGITALOCEAN_API_URL ||
      !INTERNAL_API_SECRET
    ) {
      console.error(
        "Configuration Card Payment incomplète."
      );

      return res.status(500).json({
        success: false,
        error: "Configuration du paiement indisponible.",
      });
    }

    const siteUrl = SITE_URL.replace(/\/+$/, "");

    const serverUrl =
      DIGITALOCEAN_API_URL.replace(/\/+$/, "");

    if (
      !siteUrl.startsWith("https://") ||
      !serverUrl.startsWith("https://")
    ) {
      return res.status(500).json({
        success: false,
        error: "Les serveurs doivent utiliser HTTPS.",
      });
    }

    // =========================================
    // 4. CRÉATION DE LA RÉFÉRENCE
    // =========================================

    const reference = `CARD_${crypto.randomUUID()}`;

    const paymentRef = db
      .collection("paiements")
      .doc();

    // =========================================
    // 5. ENREGISTREMENT FIRESTORE
    // =========================================

    await paymentRef.set({
      reference,

      amount: Number(numericAmount.toFixed(2)),
      currency: "USD",

      paymentMethod: "card",
      method: "card",

      status: "pending",
      Trans_Status: "Pending",

      firstname: cleanFirstname,
      lastname: cleanLastname,
      email: cleanEmail,
      phone: cleanPhone,

      address: cleanAddress,
      city: cleanCity,
      country: cleanCountry,

      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // =========================================
    // 6. URLS DE RETOUR ET WEBHOOK
    // =========================================

    const callbackUrl =
      `${siteUrl}/api/gofreshpay/webhook`;

    const returnUrl =
      `${siteUrl}/paiement/carte/retour`;

    const cancelUrl =
      `${siteUrl}/paiement/carte/annule`;

    // =========================================
    // 7. CONSTRUCTION DE LA REQUÊTE FRESHPAY
    // =========================================

    const payload = {
      amount: Number(numericAmount.toFixed(2)),
      currency: "USD",

      merchant_reference: reference,

      callback_url: callbackUrl,

      bill_to_forename: cleanFirstname,
      bill_to_surname: cleanLastname,
      bill_to_email: cleanEmail,
      bill_to_phone: cleanPhone,

      bill_to_address_line1: cleanAddress,
      bill_to_address_city: cleanCity,
      bill_to_address_country: cleanCountry,

      return_url: returnUrl,
      cancel_url: cancelUrl,
    };

    // =========================================
    // 8. COMMUNICATION DIGITALOCEAN
    // =========================================

    try {
      const response = await axios.post(
        `${serverUrl}/api/cybersource/payment`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            "X-Internal-Secret": INTERNAL_API_SECRET,
          },

          timeout: 35000,
        }
      );

      // Typage explicite de la réponse FreshPay
      const providerResponse =
        response.data as FreshPayCardResponse;

      if (
        providerResponse?.status !== "success" ||
        typeof providerResponse?.data?.links !== "string" ||
        typeof providerResponse?.data?.transaction_uuid !== "string"
      ) {
        console.error(
          "Réponse FreshPay non conforme :",
          {
            status: providerResponse?.status,
          }
        );

        return res.status(502).json({
          success: false,
          error:
            "FreshPay n'a pas retourné un lien de paiement valide.",
          reference,
        });
      }

      const checkoutUrl =
        providerResponse.data.links;

      const transactionId =
        providerResponse.data.transaction_uuid;

      // =========================================
      // 8.1 VALIDATION URL CHECKOUT
      // =========================================

      let parsedCheckoutUrl: URL;

      try {
        parsedCheckoutUrl = new URL(checkoutUrl);
      } catch {
        return res.status(502).json({
          success: false,
          error: "URL de paiement non valide.",
          reference,
        });
      }

      if (
        parsedCheckoutUrl.protocol !== "https:" ||
        parsedCheckoutUrl.hostname !==
          "uc.card.gofreshpay.com"
      ) {
        console.error(
          "URL de checkout FreshPay invalide."
        );

        return res.status(502).json({
          success: false,
          error: "URL de paiement non valide.",
          reference,
        });
      }

      // =========================================
      // 9. MISE À JOUR FIRESTORE
      // =========================================

      await paymentRef.update({
        transactionId,
        checkoutUrl,

        status: "pending",
        Trans_Status: "Pending",

        updatedAt: new Date(),
      });

      // =========================================
      // 10. RÉPONSE AU FRONTEND
      // =========================================

      return res.status(200).json({
        success: true,
        reference,
        checkoutUrl,
      });

    } catch (error: unknown) {
      console.error(
        "Erreur communication DigitalOcean :",
        isAxiosLikeError(error)
          ? {
              status: error.response?.status,
              code: error.code,
            }
          : error instanceof Error
            ? error.message
            : "Erreur inconnue"
      );

      // Le paiement reste pending.
      // Une erreur réseau ne prouve pas
      // que FreshPay n'a pas créé la transaction.

      return res.status(502).json({
        success: false,
        error:
          "La demande n'a pas pu être confirmée. Vérifiez son état avant de réessayer.",
        reference,
      });
    }

  } catch (error: unknown) {
    console.error(
      "CardPaiement API error:",
      error instanceof Error
        ? error.message
        : "Erreur inconnue"
    );

    return res.status(500).json({
      success: false,
      error:
        "Erreur interne lors de la préparation du paiement.",
    });
  }
}