import type { NextApiRequest, NextApiResponse } from "next";
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
  if (key.length !== 16) {
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
}