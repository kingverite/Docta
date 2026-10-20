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

type ProviderData = Record<string, unknown>;

function generateReference(): string {
  return `CARD_${Date.now()}_${crypto
    .randomBytes(4)
    .toString("hex")}`;
}

function isRecord(value: unknown): value is ProviderData {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function getString(
  object: ProviderData,
  key: string
): string | undefined {
  const value = object[key];

  return typeof value === "string"
    ? value
    : undefined;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {

  // --------------------------///////////////////////////////////------------------------
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
    // 2. Lire les données du client
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
    // 3. Valider le montant et la devise
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
    // 4. Vérifier les informations obligatoires
    // --------------------------------------------------

    const requiredFields: Record<string, unknown> = {
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
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error:
          "Certaines informations obligatoires sont manquantes.",
      });
    }

    const normalizedCountry = country.trim().toUpperCase();

    if (!/^[A-Z]{2}$/.test(normalizedCountry)) {
      return res.status(400).json({
        success: false,
        error:
          "Le pays doit être indiqué avec un code ISO à deux lettres, par exemple CD pour la RDC.",
      });
    }

    // --------------------------------------------------
    // 5. Vérifier les variables d'environnement Vercel
    // --------------------------------------------------

    const digitalOceanApiUrl =
      process.env.DIGITALOCEAN_API_URL;

    const internalApiSecret =
      process.env.INTERNAL_API_SECRET;

      console.log("Vérification de la configuration :", {
  digitalOceanUrlConfiguree: Boolean(digitalOceanApiUrl),
  internalSecretConfigure: Boolean(internalApiSecret),
  urlExemple:
    digitalOceanApiUrl?.includes("example.com") ?? false,
});

    if (!digitalOceanApiUrl || !internalApiSecret) {
      console.error(
        "Configuration DigitalOcean manquante."
      );

      return res.status(500).json({
        success: false,
        error:
          "La configuration du serveur de paiement est incomplète.",
      });
    }

    let baseUrl: URL;

    try {
      baseUrl = new URL(digitalOceanApiUrl);
    } catch {
      return res.status(500).json({
        success: false,
        error:
          "L'adresse du serveur de paiement est invalide.",
      });
    }

    if (
      baseUrl.protocol !== "https:" ||
      baseUrl.hostname === "example.com" ||
      baseUrl.hostname.endsWith(".example.com")
    ) {
      console.error(
        "L'adresse du serveur de paiement n'est pas correctement configurée."
      );

      return res.status(500).json({
        success: false,
        error:
          "L'adresse HTTPS du serveur de paiement doit être configurée dans Vercel.",
      });
    }

    // --------------------------------------------------
    // 6. Générer une référence unique
    // --------------------------------------------------

    const merchantReference = generateReference();

    // --------------------------------------------------
    // 7. Préparer la requête destinée à DigitalOcean
    // --------------------------------------------------

    const paymentPayload: Record<string, unknown> = {
      amount: Number(numericAmount.toFixed(2)),

      merchant_reference: merchantReference,

      bill_to_forename: firstname.trim(),
      bill_to_surname: lastname.trim(),
      bill_to_email: email.trim(),
      bill_to_phone: phone.trim(),

      bill_to_address_line1: address.trim(),
      bill_to_address_city: city.trim(),
      bill_to_address_country: normalizedCountry,

      callback_url: process.env.MOKO_CALLBACK_URL,
      return_url: process.env.MOKO_RETURN_URL,
      cancel_url: process.env.MOKO_CANCEL_URL,
    };

    if (state?.trim()) {
      paymentPayload.bill_to_address_state =
        state.trim();
    }

    if (postalCode?.trim()) {
      paymentPayload.bill_to_address_postal_code =
        postalCode.trim();
    }

    // --------------------------------------------------
    // 8. Appeler le serveur Express par HTTPS
    // --------------------------------------------------

    const endpoint = new URL(
      "/api/cybersource/payment",
      baseUrl
    ).toString();

    const response = await axios.post<unknown>(
      endpoint,
      paymentPayload,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Secret": internalApiSecret,
        },

        timeout: 30000,

        validateStatus: () => true,
      }
    );

    // --------------------------------------------------
    // 9. Interpréter la réponse du prestataire
    // --------------------------------------------------

    if (response.status < 200 || response.status >= 300) {
      const providerError: unknown = response.data;

      let errorMessage =
        "Impossible d'initialiser le paiement par carte.";

      if (isRecord(providerError)) {
        errorMessage =
          getString(providerError, "error") ||
          getString(providerError, "message") ||
          getString(providerError, "detail") ||
          errorMessage;
      }

      console.error(
        "Échec de l'initialisation du paiement :",
        {
          httpStatus: response.status,
          reference: merchantReference,
        }
      );

      return res.status(502).json({
        success: false,
        error: errorMessage,
      });
    }

    const providerData: ProviderData =
      isRecord(response.data)
        ? response.data
        : {};

    const providerStatus = String(
      providerData.status ?? ""
    ).toLowerCase();

    const paymentData: ProviderData =
      isRecord(providerData.data)
        ? providerData.data
        : {};

    const paymentUrl = getString(
      paymentData,
      "links"
    );

    const transactionUuid =
      getString(paymentData, "transaction_uuid") ||
      getString(paymentData, "transaction_id") ||
      getString(paymentData, "id");

    if (
      providerStatus !== "success" ||
      !paymentUrl ||
      !/^https:\/\//i.test(paymentUrl)
    ) {
      console.error(
        "Réponse du prestataire inattendue :",
        {
          httpStatus: response.status,
          providerStatus,
          reference: merchantReference,
          hasPaymentUrl: Boolean(paymentUrl),
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

        transactionUuid: transactionUuid || null,

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
        country: normalizedCountry,

        state: state?.trim() || "",
        postalCode: postalCode?.trim() || "",

        transactionStatus:
          getString(
            paymentData,
            "transaction_status"
          ) || "PENDING",

        paymentUrl,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    );

    // --------------------------------------------------
    // 11. Répondre au frontend
    // --------------------------------------------------

    return res.status(200).json({
      success: true,

      message:
        "Paiement initialisé avec succès.",

      paymentId: paymentDoc.id,

      reference: merchantReference,

      transactionUuid,

      paymentUrl,
    });
  } catch (error: unknown) {
  let errorMessage =
    "Une erreur est survenue lors de l'initialisation du paiement.";

  if (error instanceof Error) {
    const axiosError = error as Error & {
      response?: {
        status?: number;
        data?: unknown;
      };
      code?: string;
    };

    console.error("Erreur cardPaiement :", {
      message: axiosError.message,
      status: axiosError.response?.status,
      code: axiosError.code,
    });
  } else {
    console.error(
      "Erreur cardPaiement inconnue."
    );
  }

  return res.status(502).json({
    success: false,
    error: errorMessage,
  });
}
}