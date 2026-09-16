import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";

import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

/**
 * Clés fournies par FreshPay
 *
 * IMPORTANT :
 * Mets les vraies clés dans les variables d'environnement
 * et ne les publie jamais dans GitHub.
 */
const SECRET_KEY4 = process.env.GOFRESHPAY_SECRET_KEY4 || "";
const HMAC_KEY4 = process.env.GOFRESHPAY_HMAC_KEY4 || "";

/**
 * Vérification de la signature HMAC-SHA256
 *
 * FreshPay signe le contenu chiffré "data".
 */
function verifySignature(
  encryptedMessage: string,
  receivedSignature: string
): boolean {
  const hmac = crypto.createHmac("sha256", HMAC_KEY4);

  hmac.update(encryptedMessage);

  const calculatedSignature = hmac.digest("hex");

  /**
   * Comparaison sécurisée des signatures.
   */
  const receivedBuffer = Buffer.from(receivedSignature, "utf8");
  const calculatedBuffer = Buffer.from(calculatedSignature, "utf8");

  if (receivedBuffer.length !== calculatedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    calculatedBuffer,
    receivedBuffer
  );
}

/**
 * Déchiffrement AES-CBC
 *
 * Le PDF FreshPay utilise :
 * AES-CBC
 * IV = SECRET_KEY
 * données encodées en Base64
 */
function decryptData(encryptedData: string): any {
  /**
   * Le PDF indique une clé AES de 16 bytes
   * dans son exemple Node.js.
   */
  const secretKey = Buffer.from(SECRET_KEY4, "utf8");

  if (secretKey.length !== 16) {
    throw new Error(
      `SECRET_KEY4 invalide : ${secretKey.length} bytes reçus, 16 attendus`
    );
  }

  /**
   * Le PDF utilise SECRET_KEY comme IV.
   */
  const iv = secretKey;

  const decipher = crypto.createDecipheriv(
    "aes-128-cbc",
    secretKey,
    iv
  );

  /**
   * data est une chaîne Base64.
   */
  let decrypted = decipher.update(
    encryptedData,
    "base64",
    "utf8"
  );

  decrypted += decipher.final("utf8");

  /**
   * Le contenu déchiffré est du JSON.
   */
  return JSON.parse(decrypted);
}

/**
 * Type du callback déchiffré FreshPay
 */
type FreshPayCallback = {
  Action?: string;
  Amount?: number;
  Currency?: string;
  Customer_Details?: string;
  Financial_Institution_id?: string;
  Method?: string;
  Reference?: string;

  /**
   * Status = réception de la requête par FreshPay
   */
  Status?: string;

  /**
   * Trans_Status = véritable résultat de la transaction
   */
  Trans_Status?: string;

  /**
   * Explication du résultat
   */
  Trans_Status_Description?: string;

  Transaction_id?: string;

  Created_at?: string;
  Updated_at?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  /**
   * Seulement POST
   */
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    console.log("=================================");
    console.log("📥 WEBHOOK GOFRESHPAY REÇU");
    console.log("=================================");

    /**
     * Vérification des clés
     */
    if (!SECRET_KEY4 || !HMAC_KEY4) {
      console.error(
        "❌ Clés FreshPay absentes des variables d'environnement"
      );

      return res.status(500).json({
        error: "Configuration FreshPay manquante",
      });
    }

    /**
     * Selon le PDF :
     *
     * {
     *   "data": "<ENCRYPTED_PAYLOAD>"
     * }
     */
    const encryptedData = req.body?.data;

    /**
     * X-Signature envoyé par FreshPay
     */
    const receivedSignature =
      req.headers["x-signature"];

    if (!encryptedData) {
      console.error("❌ Champ 'data' manquant");

      return res.status(400).json({
        error: "Encrypted data missing",
      });
    }

    if (!receivedSignature) {
      console.error("❌ Header X-Signature manquant");

      return res.status(400).json({
        error: "Signature missing",
      });
    }

    /**
     * Next.js peut représenter un header comme string[]
     * dans certains cas.
     */
    const signature = Array.isArray(receivedSignature)
      ? receivedSignature[0]
      : receivedSignature;

    console.log(
      "🔐 Signature reçue :",
      signature
    );

    /**
     * ==================================================
     * 1. VÉRIFICATION HMAC
     * ==================================================
     */
    const signatureValid = verifySignature(
      encryptedData,
      signature
    );

    if (!signatureValid) {
      console.error("❌ Signature HMAC invalide");

      return res.status(401).json({
        error: "Invalid signature",
      });
    }

    console.log("✅ Signature HMAC valide");

    /**
     * ==================================================
     * 2. DÉCHIFFREMENT AES
     * ==================================================
     */
    let data: FreshPayCallback;

    try {
      data = decryptData(encryptedData);
    } catch (error) {
      console.error(
        "❌ Erreur déchiffrement FreshPay :",
        error
      );

      return res.status(400).json({
        error: "Invalid encryption",
      });
    }

    /**
     * Affichage du callback déchiffré
     *
     * NE PAS afficher les clés secrètes.
     */
    console.log(
      "📦 CALLBACK DÉCHIFFRÉ :",
      JSON.stringify(data, null, 2)
    );

    /**
     * ==================================================
     * 3. VÉRIFICATION DE LA RÉFÉRENCE
     * ==================================================
     */
    if (!data.Reference) {
      console.error(
        "❌ Reference manquante dans le callback"
      );

      return res.status(400).json({
        error: "Reference manquante",
      });
    }

    /**
     * ==================================================
     * 4. RECHERCHE DU PAIEMENT FIRESTORE
     * ==================================================
     */
    const q = query(
      collection(db, "paiements"),
      where("reference", "==", data.Reference)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.error(
        "❌ Paiement introuvable :",
        data.Reference
      );

      return res.status(404).json({
        error: "Paiement introuvable",
      });
    }

    const paymentDoc = snapshot.docs[0];

    /**
     * ==================================================
     * 5. DÉTERMINATION DU STATUT
     * ==================================================
     *
     * FreshPay indique que le véritable résultat
     * est Trans_Status.
     */
    let applicationStatus = "pending";
    let statusLabel = "En attente";

    if (data.Trans_Status === "Successful") {
      applicationStatus = "success";
      statusLabel = "Paiement réussi";
    }

    if (data.Trans_Status === "Failed") {
      applicationStatus = "failed";
      statusLabel = "Paiement échoué";
    }

    /**
     * ==================================================
     * 6. MISE À JOUR FIRESTORE
     * ==================================================
     */
    await updateDoc(paymentDoc.ref, {
      /**
       * Statut utilisé par ton application
       */
      status: applicationStatus,
      statusLabel,

      /**
       * Réponses FreshPay
       */
      Status: data.Status || null,
      Trans_Status: data.Trans_Status || null,
      Trans_Status_Description:
        data.Trans_Status_Description || null,

      Reference: data.Reference || null,

      Customer_Details:
        data.Customer_Details || null,

      Amount: data.Amount ?? null,

      Currency: data.Currency || null,

      Method: data.Method || null,

      Transaction_id:
        data.Transaction_id || null,

      Financial_Institution_id:
        data.Financial_Institution_id || null,

      Created_at:
        data.Created_at || null,

      Updated_at:
        data.Updated_at || null,

      Comment: data.Trans_Status_Description || null,

      updatedAt: new Date(),
    });

    console.log("=================================");
    console.log("✅ PAIEMENT MIS À JOUR");
    console.log("Reference :", data.Reference);
    console.log("Status :", data.Status);
    console.log("Trans_Status :", data.Trans_Status);
    console.log(
      "Trans_Status_Description :",
      data.Trans_Status_Description
    );
    console.log("Application status :", applicationStatus);
    console.log("=================================");

    /**
     * ==================================================
     * 7. RÉPONSE À FRESHPAY
     * ==================================================
     */
    return res.status(200).json({
      status: "Callback received successfully",
      data: {
        Reference: data.Reference,
        Trans_Status: data.Trans_Status,
      },
    });
  } catch (error: any) {
    console.error(
      "❌ ERREUR WEBHOOK :",
      error?.message || error
    );

    return res.status(500).json({
      error: "Erreur lors du traitement du webhook",
    });
  }
}