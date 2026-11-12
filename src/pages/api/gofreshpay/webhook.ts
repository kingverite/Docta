/*import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";

import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

const SECRET_KEY4 = process.env.GOFRESHPAY_SECRET_KEY4 || "";
const HMAC_KEY4 = process.env.GOFRESHPAY_HMAC_KEY4 || "";

type FreshPayCallback = {
  Action?: string;
  Amount?: number | string;
  Currency?: string;
  Customer_Details?: string;
  Financial_Institution_id?: string;
  Method?: string;
  Reference?: string;
  Status?: string;
  Trans_Status?: string;
  Trans_Status_Description?: string;
  Transaction_id?: string;
  Created_at?: string;
  Updated_at?: string;
};

function verifySignature(
  encryptedData: string,
  receivedSignature: string
): boolean {
  if (!HMAC_KEY4) return false;

  const calculatedSignature = crypto
    .createHmac("sha256", HMAC_KEY4)
    .update(encryptedData, "utf8")
    .digest("hex");

  const expected = Buffer.from(calculatedSignature, "utf8");
  const received = Buffer.from(receivedSignature, "utf8");

  if (expected.length !== received.length) return false;

  return crypto.timingSafeEqual(expected, received);
}

function decryptData(encryptedData: string): FreshPayCallback {
  const key = Buffer.from(SECRET_KEY4, "utf8");

  /*
   * Le code existant et certains exemples FreshPay utilisent
   * AES-128-CBC avec une clé de 16 octets employée comme IV.
   *
   * Le document FreshPay contient une contradiction sur AES-128
   * versus AES-256. Confirmer ce point auprès du fournisseur avant
   * de considérer le webhook comme validé en production.
   */
  /*if (key.length !== 16) {
    throw new Error("Clé de déchiffrement invalide.");
  }

  const encryptedBytes = Buffer.from(encryptedData, "base64");

  if (encryptedBytes.length === 0) {
    throw new Error("Données chiffrées vides.");
  }

  const decipher = crypto.createDecipheriv(
    "aes-128-cbc",
    key,
    key
  );

  const decrypted = Buffer.concat([
    decipher.update(encryptedBytes),
    decipher.final(),
  ]).toString("utf8");

  const parsed: unknown = JSON.parse(decrypted);

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    Array.isArray(parsed)
  ) {
    throw new Error("Format du callback invalide.");
  }

  return parsed as FreshPayCallback;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  if (!SECRET_KEY4 || !HMAC_KEY4) {
    console.error("Configuration du webhook FreshPay manquante.");

    return res.status(500).json({
      error: "Configuration du webhook manquante",
    });
  }

  const encryptedData = req.body?.data;
  const signatureHeader = req.headers["x-signature"];

  const receivedSignature = Array.isArray(signatureHeader)
    ? signatureHeader[0]
    : signatureHeader;

  if (
    typeof encryptedData !== "string" ||
    !encryptedData ||
    typeof receivedSignature !== "string" ||
    !receivedSignature
  ) {
    return res.status(400).json({
      error: "Données ou signature manquantes",
    });
  }

  try {
    if (!verifySignature(encryptedData, receivedSignature)) {
      return res.status(401).json({
        error: "Invalid signature",
      });
    }

    let data: FreshPayCallback;

    try {
      data = decryptData(encryptedData);
    } catch {
      return res.status(400).json({
        error: "Invalid encryption",
      });
    }

    if (
      typeof data.Reference !== "string" ||
      !data.Reference.trim()
    ) {
      return res.status(400).json({
        error: "Reference manquante",
      });
    }

    const paymentQuery = query(
      collection(db, "paiements"),
      where("reference", "==", data.Reference)
    );

    const snapshot = await getDocs(paymentQuery);

    if (snapshot.empty) {
      console.error("Référence du callback introuvable.");

      return res.status(404).json({
        error: "Paiement introuvable",
      });
    }

    let applicationStatus: "success" | "failed" | "pending" = "pending";
    let statusLabel = "En attente";

    if (data.Trans_Status === "Successful") {
      applicationStatus = "success";
      statusLabel = "Paiement réussi";
    } else if (data.Trans_Status === "Failed") {
      applicationStatus = "failed";
      statusLabel = "Paiement échoué";
    } else if (
      data.Trans_Status === "Pending" ||
      data.Trans_Status === "Submitted"
    ) {
      applicationStatus = "pending";
      statusLabel = "En attente";
    }

    for (const paymentDoc of snapshot.docs) {
      const existing = paymentDoc.data();

      // Un callback tardif ne doit pas remplacer un statut final.
      if (
        existing.status === "success" ||
        existing.status === "failed"
      ) {
        continue;
      }

      await updateDoc(paymentDoc.ref, {
        status: applicationStatus,
        statusLabel,

        Status: data.Status || null,
        Trans_Status: data.Trans_Status || null,
        Trans_Status_Description:
          data.Trans_Status_Description || null,
        Reference: data.Reference,
        Customer_Details: data.Customer_Details || null,
        Amount: data.Amount ?? null,
        Currency: data.Currency || null,
        Method: data.Method || null,
        Transaction_id: data.Transaction_id || null,
        Financial_Institution_id:
          data.Financial_Institution_id || null,
        Created_at: data.Created_at || null,
        Updated_at: data.Updated_at || null,

        Comment: data.Trans_Status_Description || null,
        updatedAt: serverTimestamp(),
      });
    }

    console.log("Callback FreshPay traité :", {
      reference: data.Reference,
      status: applicationStatus,
    });

    return res.status(200).json({
      status: "Callback received successfully",
      data: {
        Reference: data.Reference,
        Trans_Status: data.Trans_Status || null,
      },
    });
  } catch (error) {
    console.error(
      "Erreur webhook FreshPay :",
      error instanceof Error ? error.message : "Erreur inconnue"
    );

    return res.status(500).json({
      error: "Erreur lors du traitement du webhook",
    });
  }
}*/

import type {
  NextApiRequest,
  NextApiResponse,
} from "next";

import crypto from "crypto";

import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

// ======================================================
// CONFIGURATION MOBILE MONEY
// ======================================================

const SECRET_KEY4 =
  process.env.GOFRESHPAY_SECRET_KEY4 || "";

const HMAC_KEY4 =
  process.env.GOFRESHPAY_HMAC_KEY4 || "";

// ======================================================
// CONFIGURATION CARD PAYMENT
// ======================================================

const CARD_CALLBACK_SECRET =
  process.env.CARD_CALLBACK_SECRET || "";

// ======================================================
// TYPES MOBILE MONEY
// ======================================================

type FreshPayMobileMoneyCallback = {
  Action?: string;
  Amount?: number | string;
  Currency?: string;
  Customer_Details?: string;
  Financial_Institution_id?: string;
  Method?: string;
  Reference?: string;
  Status?: string;
  Trans_Status?: string;
  Trans_Status_Description?: string;
  Transaction_id?: string;
  Created_at?: string;
  Updated_at?: string;
};

// ======================================================
// TYPES CARD PAYMENT
// ======================================================

type FreshPayCardCallback = {
  event_type?: string;

  status?: string;
  reference?: string;

  amount?: number | string;
  currency?: string;

  decision?: string;
  message?: string;

  transaction_uuid?: string;

  card_type?: string;
  card_last4?: string;
  card_expiry_date?: string;
  card_bin_country?: string;
  card_issuer?: string;
  card_scheme?: string;

  timestamp?: string;
};

// ======================================================
// OUTIL : LIRE LE CORPS BRUT
// ======================================================

async function getRawBody(
  req: NextApiRequest
): Promise<Buffer> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(
      Buffer.isBuffer(chunk)
        ? chunk
        : Buffer.from(chunk)
    );
  }

  return Buffer.concat(chunks);
}

// ======================================================
// SIGNATURE MOBILE MONEY
// ======================================================

function verifyMobileMoneySignature(
  encryptedData: string,
  receivedSignature: string
): boolean {
  if (!HMAC_KEY4) return false;

  const calculatedSignature = crypto
    .createHmac("sha256", HMAC_KEY4)
    .update(encryptedData, "utf8")
    .digest("hex");

  const expected = Buffer.from(
    calculatedSignature,
    "utf8"
  );

  const received = Buffer.from(
    receivedSignature,
    "utf8"
  );

  if (expected.length !== received.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    expected,
    received
  );
}

// ======================================================
// DÉCHIFFREMENT MOBILE MONEY
// ======================================================

function decryptMobileMoneyData(
  encryptedData: string
): FreshPayMobileMoneyCallback {

  const key = Buffer.from(
    SECRET_KEY4,
    "utf8"
  );

  if (key.length !== 16) {
    throw new Error(
      "Clé de déchiffrement invalide."
    );
  }

  const encryptedBytes = Buffer.from(
    encryptedData,
    "base64"
  );

  if (encryptedBytes.length === 0) {
    throw new Error(
      "Données chiffrées vides."
    );
  }

  const decipher = crypto.createDecipheriv(
    "aes-128-cbc",
    key,
    key
  );

  const decrypted = Buffer.concat([
    decipher.update(encryptedBytes),
    decipher.final(),
  ]).toString("utf8");

  const parsed: unknown = JSON.parse(
    decrypted
  );

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    Array.isArray(parsed)
  ) {
    throw new Error(
      "Format du callback invalide."
    );
  }

  return parsed as FreshPayMobileMoneyCallback;
}

// ======================================================
// SIGNATURE CARD PAYMENT
// ======================================================

function verifyCardSignature(
  signatureHeader: string,
  rawBody: Buffer
): boolean {

  if (!CARD_CALLBACK_SECRET) {
    return false;
  }

  try {
    const parts = Object.fromEntries(
      signatureHeader
        .split(",")
        .map((part) => {
          const separator = part.indexOf("=");

          if (separator === -1) {
            return ["", ""];
          }

          return [
            part.slice(0, separator).trim(),
            part.slice(separator + 1).trim(),
          ];
        })
    );

    const timestamp = parts.t;
    const receivedSignature = parts.v1;

    if (
      !timestamp ||
      !receivedSignature ||
      !/^\d+$/.test(timestamp) ||
      !/^[a-f0-9]{64}$/i.test(
        receivedSignature
      )
    ) {
      return false;
    }

    // FreshPay exige :
    // message = timestamp + raw_body

    const message = Buffer.concat([
      Buffer.from(timestamp, "utf8"),
      rawBody,
    ]);

    const expectedSignature = crypto
      .createHmac(
        "sha256",
        CARD_CALLBACK_SECRET
      )
      .update(message)
      .digest("hex");

    const expected = Buffer.from(
      expectedSignature,
      "hex"
    );

    const received = Buffer.from(
      receivedSignature,
      "hex"
    );

    if (expected.length !== received.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      expected,
      received
    );

  } catch {
    return false;
  }
}

// ======================================================
// OUTIL : COMPARER LES MONTANTS
// ======================================================

function amountsMatch(
  storedAmount: unknown,
  receivedAmount: unknown
): boolean {

  const stored = Number(storedAmount);
  const received = Number(receivedAmount);

  if (
    !Number.isFinite(stored) ||
    !Number.isFinite(received)
  ) {
    return false;
  }

  return (
    Math.round(stored * 100) ===
    Math.round(received * 100)
  );
}

// ======================================================
// TRAITEMENT MOBILE MONEY
// ======================================================

async function handleMobileMoney(
  encryptedData: string,
  receivedSignature: string,
  res: NextApiResponse
) {

  // Vérifier la signature.
  if (
    !verifyMobileMoneySignature(
      encryptedData,
      receivedSignature
    )
  ) {
    return res.status(401).json({
      error: "Invalid signature",
    });
  }

  // Déchiffrer les données.
  let data: FreshPayMobileMoneyCallback;

  try {
    data = decryptMobileMoneyData(
      encryptedData
    );
  } catch {
    return res.status(400).json({
      error: "Invalid encryption",
    });
  }

  if (
    typeof data.Reference !== "string" ||
    !data.Reference.trim()
  ) {
    return res.status(400).json({
      error: "Reference manquante",
    });
  }

  // Retrouver le paiement.
  const paymentQuery = query(
    collection(db, "paiements"),
    where(
      "reference",
      "==",
      data.Reference
    )
  );

  const snapshot = await getDocs(
    paymentQuery
  );

  if (snapshot.empty) {
    console.error(
      "Référence Mobile Money introuvable."
    );

    return res.status(404).json({
      error: "Paiement introuvable",
    });
  }

  let applicationStatus:
    | "success"
    | "failed"
    | "pending" = "pending";

  let statusLabel = "En attente";

  if (data.Trans_Status === "Successful") {
    applicationStatus = "success";
    statusLabel = "Paiement réussi";

  } else if (data.Trans_Status === "Failed") {
    applicationStatus = "failed";
    statusLabel = "Paiement échoué";

  } else if (
    data.Trans_Status === "Pending" ||
    data.Trans_Status === "Submitted"
  ) {
    applicationStatus = "pending";
    statusLabel = "En attente";
  }

  for (const paymentDoc of snapshot.docs) {

    const existing = paymentDoc.data();

    // Ne pas modifier un paiement déjà finalisé.
    if (
      existing.status === "success" ||
      existing.status === "failed"
    ) {
      continue;
    }

    // Protection contre une référence de carte.
    if (
      existing.paymentMethod === "card" ||
      existing.method === "card"
    ) {
      continue;
    }

    // Vérification du montant si celui-ci
    // existe dans le document.
    if (
      data.Amount !== undefined &&
      existing.amount !== undefined &&
      !amountsMatch(
        existing.amount,
        data.Amount
      )
    ) {
      console.error(
        "Montant Mobile Money incorrect."
      );

      continue;
    }

    await updateDoc(
      paymentDoc.ref,
      {
        status: applicationStatus,
        statusLabel,

        Status: data.Status || null,

        Trans_Status:
          data.Trans_Status || null,

        Trans_Status_Description:
          data.Trans_Status_Description || null,

        Reference: data.Reference,

        Customer_Details:
          data.Customer_Details || null,

        Amount: data.Amount ?? null,

        Currency: data.Currency || null,

        Method: data.Method || null,

        Transaction_id:
          data.Transaction_id || null,

        Financial_Institution_id:
          data.Financial_Institution_id || null,

        Created_at: data.Created_at || null,

        Updated_at: data.Updated_at || null,

        Comment:
          data.Trans_Status_Description || null,

        updatedAt: serverTimestamp(),
      }
    );
  }

  console.log(
    "Callback Mobile Money traité :",
    {
      reference: data.Reference,
      status: applicationStatus,
    }
  );

  return res.status(200).json({
    status: "Callback received successfully",

    data: {
      Reference: data.Reference,
      Trans_Status:
        data.Trans_Status || null,
    },
  });
}

// ======================================================
// TRAITEMENT CARD PAYMENT
// ======================================================

async function handleCardPayment(
  rawBody: Buffer,
  signatureHeader: string,
  res: NextApiResponse
) {

  // Vérifier la signature avant de lire
  // les données comme une notification fiable.
  if (
    !verifyCardSignature(
      signatureHeader,
      rawBody
    )
  ) {
    return res.status(403).json({
      error: "Invalid card signature",
    });
  }

  let data: FreshPayCardCallback;

  try {
    const parsed: unknown = JSON.parse(
      rawBody.toString("utf8")
    );

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      throw new Error("Invalid payload");
    }

    data = parsed as FreshPayCardCallback;

  } catch {
    return res.status(400).json({
      error: "Invalid card payload",
    });
  }

  // Les événements REFUND et VOID ne sont pas
  // des confirmations de paiement initial.
  if (
    data.event_type === "REFUND" ||
    data.event_type === "VOID"
  ) {
    console.log(
      "Événement Card reçu :",
      data.event_type
    );

    return res.status(200).json({
      received: true,
      message:
        "Événement reçu, traitement distinct requis.",
    });
  }

  if (
    typeof data.reference !== "string" ||
    !data.reference.trim()
  ) {
    return res.status(400).json({
      error: "Card reference manquante",
    });
  }

  if (
    typeof data.transaction_uuid !== "string" ||
    !data.transaction_uuid.trim()
  ) {
    return res.status(400).json({
      error: "Transaction UUID manquant",
    });
  }

  if (data.currency !== "USD") {
    return res.status(400).json({
      error: "Devise incorrecte",
    });
  }

  // Rechercher uniquement les paiements par carte.
  const paymentQuery = query(
    collection(db, "paiements"),

    where(
      "reference",
      "==",
      data.reference
    ),

    where(
      "paymentMethod",
      "==",
      "card"
    )
  );

  const snapshot = await getDocs(
    paymentQuery
  );

  if (snapshot.empty) {
    console.error(
      "Référence Card introuvable."
    );

    return res.status(404).json({
      error: "Paiement par carte introuvable",
    });
  }

  const paymentDoc = snapshot.docs[0];

  const existing = paymentDoc.data();

  // Vérifier l'identifiant de transaction
  // déjà enregistré lors de l'initiation.
  if (
    existing.transactionId &&
    existing.transactionId !==
      data.transaction_uuid
  ) {
    return res.status(400).json({
      error: "Transaction UUID incorrect",
    });
  }

  // Vérifier le montant.
  if (
    !amountsMatch(
      existing.amount,
      data.amount
    )
  ) {
    return res.status(400).json({
      error: "Montant incorrect",
    });
  }

  // Idempotence.
  if (
    existing.status === "success" ||
    existing.status === "failed"
  ) {
    return res.status(200).json({
      received: true,
      message: "Transaction déjà traitée",
    });
  }

  let applicationStatus:
    | "success"
    | "failed"
    | "pending" = "pending";

  let statusLabel = "En attente";

  if (
    data.status === "SUCCESS" &&
    data.decision === "ACCEPT"
  ) {
    applicationStatus = "success";
    statusLabel = "Paiement réussi";

  } else if (
    data.status === "FAILED" &&
    (
      data.decision === "REJECT" ||
      data.decision === "REVIEW"
    )
  ) {
    applicationStatus = "failed";
    statusLabel = "Paiement échoué";
  }

  await updateDoc(
    paymentDoc.ref,
    {
      status: applicationStatus,

      statusLabel,

      Trans_Status:
        applicationStatus === "success"
          ? "Successful"
          : applicationStatus === "failed"
            ? "Failed"
            : "Pending",

      Reference: data.reference,

      transactionId:
        data.transaction_uuid,

      transaction_uuid:
        data.transaction_uuid,

      Amount: data.amount,

      Currency: data.currency,

      decision: data.decision || null,

      cardType: data.card_type || null,

      cardLast4: data.card_last4 || null,

      cardScheme: data.card_scheme || null,

      cardExpiryDate:
        data.card_expiry_date || null,

      cardBinCountry:
        data.card_bin_country || null,

      cardIssuer:
        data.card_issuer || null,

      Comment: data.message || null,

      updatedAt: serverTimestamp(),

      ...(applicationStatus === "success"
        ? { paidAt: serverTimestamp() }
        : {}),
    }
  );

  console.log(
    "Callback Card traité :",
    {
      reference: data.reference,
      transaction: data.transaction_uuid,
      status: applicationStatus,
      cardType: data.card_type,
    }
  );

  return res.status(200).json({
    received: true,

    success: true,

    data: {
      reference: data.reference,
      status: applicationStatus,
      cardType: data.card_type || null,
    },
  });
}

// ======================================================
// WEBHOOK PRINCIPAL
// ======================================================

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {

    // Lire les données brutes une seule fois.
    const rawBody = await getRawBody(req);

    // Récupérer les en-têtes.
    const mobileSignatureHeader =
      req.headers["x-signature"];

    const cardSignatureHeader =
      req.headers["x-freshpay-signature"];

    const mobileSignature =
      Array.isArray(mobileSignatureHeader)
        ? mobileSignatureHeader[0]
        : mobileSignatureHeader;

    const cardSignature =
      Array.isArray(cardSignatureHeader)
        ? cardSignatureHeader[0]
        : cardSignatureHeader;

    // ==================================================
    // CAS 1 : MOBILE MONEY
    // ==================================================

    if (mobileSignature) {

      if (!SECRET_KEY4 || !HMAC_KEY4) {
        console.error(
          "Configuration Mobile Money manquante."
        );

        return res.status(500).json({
          error:
            "Configuration Mobile Money manquante",
        });
      }

      let body: {
        data?: unknown;
      };

      try {
        body = JSON.parse(
          rawBody.toString("utf8")
        );
      } catch {
        return res.status(400).json({
          error: "JSON Mobile Money invalide",
        });
      }

      const encryptedData = body?.data;

      if (
        typeof encryptedData !== "string" ||
        !encryptedData
      ) {
        return res.status(400).json({
          error: "Données Mobile Money manquantes",
        });
      }

      return await handleMobileMoney(
        encryptedData,
        mobileSignature,
        res
      );
    }

    // ==================================================
    // CAS 2 : CARD PAYMENT
    // ==================================================

    if (cardSignature) {

      if (!CARD_CALLBACK_SECRET) {
        console.error(
          "CARD_CALLBACK_SECRET manquant."
        );

        return res.status(500).json({
          error:
            "Configuration Card Payment manquante",
        });
      }

      return await handleCardPayment(
        rawBody,
        cardSignature,
        res
      );
    }

    // ==================================================
    // CAS 3 : ANNULATION CHECKOUT NON SIGNÉE
    // ==================================================

    // FreshPay documente PAYMENT_CANCELLATION
    // comme un événement non signé.
    // Il ne doit jamais valider un paiement.

    let unsignedPayload: unknown;

    try {
      unsignedPayload = JSON.parse(
        rawBody.toString("utf8")
      );
    } catch {
      return res.status(400).json({
        error: "Signature manquante",
      });
    }

    if (
      typeof unsignedPayload === "object" &&
      unsignedPayload !== null &&
      "event_type" in unsignedPayload &&
      unsignedPayload.event_type ===
        "PAYMENT_CANCELLATION"
    ) {
      console.log(
        "Annulation Checkout reçue : événement informatif."
      );

      return res.status(200).json({
        received: true,
        message:
          "Annulation reçue. En attente du statut final signé.",
      });
    }

    return res.status(401).json({
      error: "Signature manquante ou non reconnue",
    });

  } catch (error) {

    console.error(
      "Erreur webhook FreshPay :",
      error instanceof Error
        ? error.message
        : "Erreur inconnue"
    );

    return res.status(500).json({
      error:
        "Erreur lors du traitement du webhook",
    });
  }
}