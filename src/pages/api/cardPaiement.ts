import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import axios from "axios";

import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

type CardPaymentRequest = {
  amount: number;
  currency: "USD";

  firstname: string;
  lastname: string;
  email: string;
  phone: string;

  address: string;
  city: string;
  country: string;

  state?: string;
  postalCode?: string;
};

type ApiResponse = {
  success: boolean;
  message?: string;
  error?: string;

  paymentId?: string;
  reference?: string;
  transactionUuid?: string;
  paymentUrl?: string;
};

function generateReference(): string {
  return `CARD_${Date.now()}_${crypto
    .randomBytes(4)
    .toString("hex")}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // --------------------------------------------------
  // 1. Vérifier la méthode HTTP
  // --------------------------------------------------

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    return res.status(405).json({
      success: false,
      error: "Méthode non autorisée.",
    });
  }

  try {
    // --------------------------------------------------
    // 2. Lire les informations envoyées par le frontend
    // --------------------------------------------------

    const {
      amount,
      currency,
      firstname,
      lastname,
      email,
      phone,
      address,
      city,
      country,
      state,
      postalCode,
    } = req.body as CardPaymentRequest;

    // --------------------------------------------------
    // 3. Valider le montant
    // --------------------------------------------------

    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount < 1
    ) {
      return res.status(400).json({
        success: false,
        error: "Le montant minimum est de 1 USD.",
      });
    }

    if (currency !== "USD") {
      return res.status(400).json({
        success: false,
        error:
          "Le paiement par carte est disponible uniquement en USD.",
      });
    }

    // --------------------------------------------------
    // 4. Valider les informations du client
    // --------------------------------------------------

    const requiredFields = {
      firstname,
      lastname,
      email,
      phone,
      address,
      city,
      country,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(
        ([, value]) =>
          typeof value !== "string" ||
          value.trim() === ""
      )
      .map(([field]) => field);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error:
          "Certaines informations obligatoires sont manquantes.",
      });
    }

    if (
      !/^[A-Z]{2}$/i.test(country.trim())
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Le pays doit être indiqué avec un code ISO à deux lettres, par exemple CD pour la RDC.",
      });
    }

    // --------------------------------------------------
    // 5. Lire les variables d'environnement Vercel
    // --------------------------------------------------

    const DIGITALOCEAN_API_URL =
      process.env.DIGITALOCEAN_API_URL;

      console.log(
  "DIGITALOCEAN_API_URL configurée :",
  Boolean(DIGITALOCEAN_API_URL)
);

console.log(
  "DIGITALOCEAN_API_URL utilise example.com :",
  DIGITALOCEAN_API_URL?.includes("example.com")
);

    const INTERNAL_API_SECRET =
      process.env.INTERNAL_API_SECRET;

    if (
      !DIGITALOCEAN_API_URL ||
      !INTERNAL_API_SECRET
    ) {
      console.error(
        "Configuration DigitalOcean manquante."
      );

      return res.status(500).json({
        success: false,
        error:
          "La configuration du serveur de paiement est incomplète.",
      });
    }

    // --------------------------------------------------
    // 6. Générer une référence unique
    // --------------------------------------------------

    const merchantReference = generateReference();

    // --------------------------------------------------
    // 7. Préparer les données pour le serveur Express
    // --------------------------------------------------

    const paymentPayload = {
      amount: Number(numericAmount.toFixed(2)),
      merchant_reference: merchantReference,

      bill_to_forename: firstname.trim(),
      bill_to_surname: lastname.trim(),
      bill_to_email: email.trim(),
      bill_to_phone: phone.trim(),

      bill_to_address_line1: address.trim(),
      bill_to_address_city: city.trim(),
      bill_to_address_country:
        country.trim().toUpperCase(),

      ...(state?.trim()
        ? {
            bill_to_address_state: state.trim(),
          }
        : {}),

      ...(postalCode?.trim()
        ? {
            bill_to_address_postal_code:
              postalCode.trim(),
          }
        : {}),

      callback_url:
        process.env.MOKO_CALLBACK_URL,

      return_url:
        process.env.MOKO_RETURN_URL,

      cancel_url:
        process.env.MOKO_CANCEL_URL,
    };

    // --------------------------------------------------
    // 8. Appeler DigitalOcean en HTTPS
    // --------------------------------------------------

    const baseUrl =
      DIGITALOCEAN_API_URL.replace(/\/+$/, "");

    const response = await axios.post(
      `${baseUrl}/api/cybersource/payment`,
      paymentPayload,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Secret": INTERNAL_API_SECRET,
        },

        timeout: 30000,

        validateStatus: () => true,
      }
    );

    // --------------------------------------------------
    // 9. Vérifier la réponse du serveur de paiement
    // --------------------------------------------------

    if (
      response.status < 200 ||
      response.status >= 300
    ) {
      console.error(
        "Échec de l'initialisation du paiement :",
        {
          httpStatus: response.status,
          reference: merchantReference,
        }
      );

      return res.status(502).json({
        success: false,
        error:
          response.data?.error ||
          "Impossible d'initialiser le paiement par carte.",
      });
    }

    const providerData = response.data;

    const providerStatus = String(
      providerData?.status ?? ""
    ).toLowerCase();

    const paymentData = providerData?.data;

    const paymentUrl =
      paymentData?.links;

    const transactionUuid =
      paymentData?.transaction_uuid ??
      paymentData?.transaction_id ??
      paymentData?.id;

    if (
      providerStatus !== "success" ||
      typeof paymentUrl !== "string" ||
      !/^https:\/\//i.test(paymentUrl)
    ) {
      console.error(
        "Réponse du prestataire inattendue :",
        {
          httpStatus: response.status,
          providerStatus,
          reference: merchantReference,
          hasPaymentUrl:
            typeof paymentUrl === "string",
        }
      );

      return res.status(502).json({
        success: false,
        error:
          "Le prestataire n'a pas retourné de lien de paiement valide.",
      });
    }

    // --------------------------------------------------
    // 10. Enregistrer le paiement dans Firestore
    // --------------------------------------------------

    const paymentDoc = await addDoc(
      collection(db, "paiements"),
      {
        type: "card",
        provider: "MokoAfrika",

        reference: merchantReference,

        transactionUuid:
          transactionUuid || null,

        amount: numericAmount,
        currency: "USD",

        status: "pending",

        statusLabel:
          "Paiement par carte en attente",

        firstname: firstname.trim(),
        lastname: lastname.trim(),
        email: email.trim(),
        phone: phone.trim(),

        address: address.trim(),
        city: city.trim(),
        country: country.trim().toUpperCase(),

        state: state?.trim() || "",
        postalCode: postalCode?.trim() || "",

        transactionStatus:
          paymentData?.transaction_status ||
          "PENDING",

        paymentUrl,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    );

    // --------------------------------------------------
    // 11. Retourner les informations au frontend
    // --------------------------------------------------

    return res.status(200).json({
      success: true,

      message:
        "Paiement initialisé avec succès.",

      paymentId: paymentDoc.id,

      reference: merchantReference,

      transactionUuid:
        transactionUuid || undefined,

      paymentUrl,
    });
  } catch (error: unknown) {
    const axiosError = axios.isAxiosError(error)
      ? error
      : null;

    console.error(
      "Erreur cardPaiement :",
      axiosError
        ? {
            status: axiosError.response?.status,
            code: axiosError.code,
          }
        : error instanceof Error
          ? error.message
          : "Erreur inconnue"
    );

    return res.status(502).json({
      success: false,
      error:
        "Une erreur est survenue lors de l'initialisation du paiement.",
    });
  }
}