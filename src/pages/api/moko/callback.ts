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
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export const config = {
  api: {
    bodyParser: false,
  },
};

type CallbackResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

function readRawBody(
  req: NextApiRequest
): Promise<Buffer> {
  return new Promise(
    (resolve, reject) => {
      const chunks: Buffer[] = [];

      req.on(
        "data",
        (chunk: Buffer) => {
          chunks.push(
            Buffer.from(chunk)
          );
        }
      );

      req.on("end", () => {
        resolve(
          Buffer.concat(chunks)
        );
      });

      req.on("error", reject);
    }
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CallbackResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Méthode non autorisée",
    });
  }

  try {
    // --------------------------------------------------
    // 1. Secret callback
    // --------------------------------------------------

    const callbackSecret =
      process.env.MOKO_CALLBACK_SECRET;

    if (!callbackSecret) {
      console.error(
        "MOKO_CALLBACK_SECRET manquant."
      );

      return res.status(500).json({
        success: false,
        error:
          "Configuration callback incomplète.",
      });
    }

    // --------------------------------------------------
    // 2. Body brut
    // --------------------------------------------------

    const rawBody =
      await readRawBody(req);

    // --------------------------------------------------
    // 3. Header signature
    // --------------------------------------------------

    const signatureHeader =
      req.headers[
        "x-freshpay-signature"
      ];

    if (
      !signatureHeader ||
      Array.isArray(signatureHeader)
    ) {
      return res.status(403).json({
        success: false,
        error:
          "Signature callback absente.",
      });
    }

    // Exemple :
    //
    // t=1723456789,v1=abcdef...
    //

    const match =
      signatureHeader.match(
        /^t=(\d+),v1=(.+)$/
      );

    if (!match) {
      return res.status(403).json({
        success: false,
        error:
          "Format de signature invalide.",
      });
    }

    const timestamp = match[1];
    const receivedSignature =
      match[2];

    // --------------------------------------------------
    // 4. Calcul HMAC
    // --------------------------------------------------

    const message = Buffer.concat([
      Buffer.from(timestamp),
      rawBody,
    ]);

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          callbackSecret
        )
        .update(message)
        .digest("hex");

    // --------------------------------------------------
    // 5. Comparaison constant-time
    // --------------------------------------------------

    const receivedBuffer =
      Buffer.from(
        receivedSignature,
        "utf8"
      );

    const expectedBuffer =
      Buffer.from(
        expectedSignature,
        "utf8"
      );

    if (
      receivedBuffer.length !==
      expectedBuffer.length
    ) {
      return res.status(403).json({
        success: false,
        error:
          "Signature callback invalide.",
      });
    }

    if (
      !crypto.timingSafeEqual(
        receivedBuffer,
        expectedBuffer
      )
    ) {
      return res.status(403).json({
        success: false,
        error:
          "Signature callback invalide.",
      });
    }

    // --------------------------------------------------
    // 6. JSON
    // --------------------------------------------------

    const data = JSON.parse(
      rawBody.toString("utf8")
    );

    console.log(
      "Callback Moko reçu :",
      data
    );

    // --------------------------------------------------
    // 7. Informations importantes
    // --------------------------------------------------

    const reference =
      data.reference;

    const transactionUuid =
      data.transaction_uuid;

    const providerStatus =
      String(
        data.status || ""
      ).toUpperCase();

    if (
      !reference ||
      !transactionUuid
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Référence ou transaction_uuid manquant.",
      });
    }

    // --------------------------------------------------
    // 8. Recherche Firestore
    // --------------------------------------------------

    const paymentsRef =
      collection(
        db,
        "paiements"
      );

    const paymentQuery = query(
      paymentsRef,
      where(
        "reference",
        "==",
        reference
      )
    );

    const snapshot =
      await getDocs(
        paymentQuery
      );

    if (snapshot.empty) {
      console.error(
        "Paiement introuvable :",
        reference
      );

      return res.status(404).json({
        success: false,
        error:
          "Paiement introuvable.",
      });
    }

    // --------------------------------------------------
    // 9. Statut
    // --------------------------------------------------

    let applicationStatus =
      "pending";

    let statusLabel =
      "Paiement en attente";

    if (
      providerStatus ===
      "SUCCESS"
    ) {
      applicationStatus =
        "success";

      statusLabel =
        "Paiement réussi";
    } else if (
      providerStatus ===
      "FAILED"
    ) {
      applicationStatus =
        "failed";

      statusLabel =
        "Paiement échoué";
    } else if (
      providerStatus ===
      "CANCELLED"
    ) {
      applicationStatus =
        "cancelled";

      statusLabel =
        "Paiement annulé";
    }

    // --------------------------------------------------
    // 10. Mise à jour Firestore
    // --------------------------------------------------

    for (const paymentDoc of snapshot.docs) {
      await updateDoc(
        paymentDoc.ref,
        {
          status:
            applicationStatus,

          statusLabel,

          providerStatus,

          decision:
            data.decision || "",

          message:
            data.message || "",

          reference:

            data.reference,

          transactionUuid:

            data.transaction_uuid,

          amount:
            data.amount,

          currency:
            data.currency,

          authCavvResult:
            data.auth_cavv_result ||
            "",

          customerName:
            data.customer_name ||
            "",

          customerEmail:
            data.customer_email ||
            "",

          cavvMessage:
            data.cavv_message ||
            "",

          cardType:
            data.card_type ||
            "",

          cardLast4:
            data.card_last4 ||
            "",

          cardExpiryDate:
            data.card_expiry_date ||
            "",

          cardBinCountry:
            data.card_bin_country ||
            "",

          cardIssuer:
            data.card_issuer ||
            "",

          cardScheme:
            data.card_scheme ||
            "",

          updatedAt:
            new Date().toISOString(),
        }
      );
    }

    console.log(
      "Paiement Firestore mis à jour :",
      reference,
      applicationStatus
    );

    return res.status(200).json({
      success: true,
      message:
        "Callback traité avec succès.",
    });
  } catch (error: any) {
    console.error(
      "Erreur callback Moko :",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        "Erreur lors du traitement du callback.",
    });
  }
}