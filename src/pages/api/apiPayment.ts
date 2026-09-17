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
} from "firebase/firestore";

/**
 * =====================================================
 * RÉPONSE GOFRESHPAY LORS DE L'INITIALISATION
 * =====================================================
 */
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

/**
 * =====================================================
 * RÉPONSE GOFRESHPAY POUR VERIFY
 * =====================================================
 */
type GoFreshPayVerifyResponse = {
  Action?: string;
  Amount?: number;
  Comment?: string;
  Created_at?: string;
  Currency?: string;
  Customer_Details?: string;
  Financial_Institution_id?: string;
  Method?: string;
  Reference?: string;
  Status?: string;
  Trans_Status?: string;
  Trans_Status_Description?: string;
  Transaction_id?: string;
  Updated_at?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  /**
   * =====================================================
   * 1. AUTORISER UNIQUEMENT POST
   * =====================================================
   */
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    /**
     * =====================================================
     * 2. RÉCUPÉRATION DES DONNÉES
     * =====================================================
     */
    const {
      phone,
      amount,
      telecom,
      firstname,
      lastname,
      email,
    } = req.body;

    console.log("=================================");
    console.log("💳 NOUVELLE DEMANDE DE PAIEMENT");
    console.log("=================================");

    console.log("Phone :", phone);
    console.log("Amount :", amount);
    console.log("Telecom :", telecom);
    console.log("Firstname :", firstname);
    console.log("Lastname :", lastname);
    console.log("Email :", email);

    /**
     * =====================================================
     * 3. DONNÉES OBLIGATOIRES
     * =====================================================
     */
    if (!phone || !amount || !telecom) {
      return res.status(400).json({
        error: "Données manquantes",
      });
    }

    /**
     * =====================================================
     * 4. VALIDATION DU NUMÉRO
     * =====================================================
     */
    if (!/^243\d{9}$/.test(String(phone))) {
      return res.status(400).json({
        error:
          "Numéro invalide. Format attendu : 243XXXXXXXXX",
      });
    }

    /**
     * =====================================================
     * 5. VALIDATION DU MONTANT
     * =====================================================
     */
    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      return res.status(400).json({
        error: "Montant invalide",
      });
    }

    /**
     * =====================================================
     * 6. CORRESPONDANCE DES OPÉRATEURS
     * =====================================================
     */
    const methodMap: Record<string, string> = {
      MP: "mpesa",
      AM: "airtel",
      OM: "orange",
      AF: "afrimoney",
    };

    const method = methodMap[String(telecom)];

    if (!method) {
      return res.status(400).json({
        error: "Opérateur télécom invalide",
      });
    }

    console.log(
      "Méthode GoFreshPay :",
      method
    );

    /**
     * =====================================================
     * 7. RECHERCHE D'UNE TRANSACTION PENDING
     * =====================================================
     *
     * Une transaction SUCCESS ou FAILED ne bloque PAS
     * un nouveau paiement.
     *
     * Seule une transaction PENDING peut bloquer.
     */
    const pendingQuery = query(
      collection(db, "paiements"),
      where("phone", "==", String(phone)),
      where("status", "==", "pending")
    );

    const pendingSnapshot = await getDocs(
      pendingQuery
    );

    /**
     * =====================================================
     * 8. TRAITER UNE ANCIENNE TRANSACTION PENDING
     * =====================================================
     */
    if (!pendingSnapshot.empty) {
      console.log(
        "⚠️ Une transaction pending existe déjà."
      );

      /**
       * Nous prenons la première transaction pending.
       */
      const pendingDoc =
        pendingSnapshot.docs[0];

      const pendingData =
        pendingDoc.data();

      const pendingReference =
        pendingData.reference;

      /**
       * -------------------------------------------------
       * SANS RÉFÉRENCE
       * -------------------------------------------------
       */
      if (!pendingReference) {
        return res.status(409).json({
          error:
            "Une transaction est déjà en cours pour ce numéro.",
        });
      }

      console.log(
        "🔎 Vérification GoFreshPay :",
        pendingReference
      );

      /**
       * =================================================
       * 8.1 VERIFY GOFRESHPAY
       * =================================================
       */
      try {
        const verifyRes =
          await axios.post<GoFreshPayVerifyResponse>(
            "https://api.gofreshpay.com/api/v1/gateway",
            {
              merchant_id:
                process.env.GOFRESHPAY_MERCHANT_ID,

              merchant_secrete:
                process.env.GOFRESHPAY_MERCHANT_SECRET,

              action: "verify",

              reference:
                pendingReference,
            },
            {
              headers: {
                "Content-Type": "application/json",
              },

              timeout: 30000,
            }
          );

        const verifyData =
          verifyRes.data;

        console.log(
          "📥 Vérification GoFreshPay :",
          verifyData
        );

        /**
         * =================================================
         * 8.2 TRANSACTION RÉUSSIE
         * =================================================
         */
        if (
          verifyData.Trans_Status ===
          "Successful"
        ) {
          await updateDoc(
            pendingDoc.ref,
            {
              status: "success",

              statusLabel:
                "Paiement réussi",

              Status:
                verifyData.Status ||
                null,

              Trans_Status:
                verifyData.Trans_Status,

              Trans_Status_Description:
                verifyData.Trans_Status_Description ||
                null,

              Transaction_id:
                verifyData.Transaction_id ||
                null,

              Financial_Institution_id:
                verifyData.Financial_Institution_id ||
                null,

              Updated_at:
                verifyData.Updated_at ||
                null,

              updatedAt:
                new Date(),
            }
          );

          console.log(
            "✅ Ancienne transaction déjà réussie."
          );

          return res.status(409).json({
            error:
              "Un paiement est déjà réussi pour ce numéro.",
          });
        }

        /**
         * =================================================
         * 8.3 TRANSACTION ÉCHOUÉE
         * =================================================
         *
         * Une transaction Failed ne bloque plus.
         * Nous mettons d'abord Firestore à jour,
         * puis le code continue vers la création
         * d'un nouveau paiement.
         */
        if (
          verifyData.Trans_Status ===
          "Failed"
        ) {
          await updateDoc(
            pendingDoc.ref,
            {
              status: "failed",

              statusLabel:
                "Paiement échoué",

              Status:
                verifyData.Status ||
                null,

              Trans_Status:
                verifyData.Trans_Status,

              Trans_Status_Description:
                verifyData.Trans_Status_Description ||
                null,

              Transaction_id:
                verifyData.Transaction_id ||
                null,

              Financial_Institution_id:
                verifyData.Financial_Institution_id ||
                null,

              Updated_at:
                verifyData.Updated_at ||
                null,

              updatedAt:
                new Date(),
            }
          );

          console.log(
            "❌ Ancienne transaction = Failed."
          );

          console.log(
            "➡️ Nouveau paiement autorisé."
          );
        }

        /**
         * =================================================
         * 8.4 TRANSACTION ENCORE EN COURS
         * =================================================
         */
        if (
          verifyData.Trans_Status ===
            "Pending" ||
          verifyData.Trans_Status ===
            "Submitted"
        ) {
          console.log(
            "⏳ Ancienne transaction toujours en cours."
          );

          return res.status(409).json({
            error:
              "Une transaction est toujours en cours pour ce numéro. Veuillez attendre sa finalisation.",
          });
        }

        /**
         * =================================================
         * 8.5 STATUT INCONNU
         * =================================================
         *
         * Par sécurité, si GoFreshPay renvoie une valeur
         * que nous ne connaissons pas, nous ne créons
         * pas une deuxième transaction.
         */
        if (
          verifyData.Trans_Status !==
            "Failed" &&
          verifyData.Trans_Status !==
            "Successful" &&
          verifyData.Trans_Status !==
            "Pending" &&
          verifyData.Trans_Status !==
            "Submitted"
        ) {
          console.error(
            "⚠️ Statut GoFreshPay inconnu :",
            verifyData.Trans_Status
          );

          return res.status(409).json({
            error:
              "Impossible de déterminer le statut de la transaction précédente.",
          });
        }
      } catch (verifyError: any) {
        console.error(
          "❌ Erreur VERIFY GoFreshPay :",
          verifyError?.response?.data ||
            verifyError?.message ||
            verifyError
        );

        /**
         * Par sécurité :
         * si nous ne connaissons pas le statut réel,
         * nous ne lançons pas un nouveau paiement.
         */
        return res.status(409).json({
          error:
            "Une transaction est déjà en cours pour ce numéro. Impossible de vérifier son statut pour le moment.",
        });
      }
    }

    /**
     * =====================================================
     * 9. GÉNÉRATION D'UNE NOUVELLE RÉFÉRENCE
     * =====================================================
     */
    const reference =
      `order_${Date.now()}_` +
      Math.random()
        .toString(36)
        .substring(2, 8);

    console.log(
      "Référence générée :",
      reference
    );

    /**
     * =====================================================
     * 10. VARIABLES D'ENVIRONNEMENT
     * =====================================================
     */
    console.log(
      "Merchant ID présent :",
      Boolean(
        process.env.GOFRESHPAY_MERCHANT_ID
      )
    );

    console.log(
      "Merchant Secret présent :",
      Boolean(
        process.env.GOFRESHPAY_MERCHANT_SECRET
      )
    );

    console.log(
      "Callback URL :",
      process.env.GOFRESHPAY_CALLBACK_URL
    );

    /**
     * =====================================================
     * 11. PAYLOAD GOFRESHPAY
     * =====================================================
     */
    const payload = {
      merchant_id:
        process.env.GOFRESHPAY_MERCHANT_ID,

      merchant_secrete:
        process.env.GOFRESHPAY_MERCHANT_SECRET,

      action: "debit",

      method,

      amount:
        String(numericAmount),

      currency: "CDF",

      customer_number:
        String(phone),

      reference,

      firstname:
        firstname || "Client",

      lastname:
        lastname || "Client",

      email:
        email ||
        "client@example.com",

      callback_url:
        process.env.GOFRESHPAY_CALLBACK_URL,
    };

    /**
     * Ne jamais afficher le payload complet
     * car il contient le merchant secret.
     */
    console.log(
      "Numéro :",
      payload.customer_number
    );

    console.log(
      "Méthode :",
      payload.method
    );

    console.log(
      "Montant :",
      payload.amount
    );

    console.log(
      "Devise :",
      payload.currency
    );

    console.log(
      "Référence :",
      payload.reference
    );

    /**
     * =====================================================
     * 12. ENVOI DU PAIEMENT À GOFRESHPAY
     * =====================================================
     */
    const paymentRes =
      await axios.post<GoFreshPayResponse>(
        "https://api.gofreshpay.com/api/v1/gateway",
        payload,
        {
          headers: {
            "Content-Type":
              "application/json",
          },

          timeout: 30000,
        }
      );

    const data =
      paymentRes.data;

    console.log(
      "📥 Réponse GoFreshPay :",
      data
    );

    /**
     * =====================================================
     * 13. VÉRIFICATION DE LA RÉFÉRENCE
     * =====================================================
     */
    if (!data.Reference) {
      console.error(
        "❌ Reference absente de la réponse GoFreshPay."
      );

      return res.status(502).json({
        error:
          "Réponse GoFreshPay invalide : Reference manquante",
      });
    }

    /**
     * =====================================================
     * 14. NOM OPÉRATEUR
     * =====================================================
     */
    const operatorName =
      telecom === "AM"
        ? "Airtel"
        : telecom === "OM"
        ? "Orange"
        : telecom === "MP"
        ? "Mpesa"
        : "Afrimoney";

    /**
     * =====================================================
     * 15. CRÉATION DU DOCUMENT FIRESTORE
     * =====================================================
     *
     * Le statut initial est TOUJOURS pending.
     *
     * Même si GoFreshPay répond :
     *
     * Status: Success
     *
     * cela signifie seulement que la demande a été reçue.
     */
    const paymentDoc =
      await addDoc(
        collection(db, "paiements"),
        {
          /**
           * Informations client
           */
          phone:
            String(phone),

          firstname:
            firstname || null,

          lastname:
            lastname || null,

          email:
            email || null,

          /**
           * Informations paiement
           */
          amount:
            numericAmount,

          telecom,

          operatorName,

          reference:
            data.Reference,

          /**
           * Statut application
           */
          status:
            "pending",

          statusLabel:
            "En attente",

          /**
           * Réponse initiale GoFreshPay
           */
          Status:
            data.Status || null,

          Comment:
            data.Comment || null,

          Customer_Number:
            data.Customer_Number ||
            null,

          Currency:
            data.Currency || null,

          Transaction_id:
            data.Transaction_id ||
            null,

          Created_At:
            data.Created_At ||
            null,

          Updated_At:
            data.Updated_At ||
            null,

          /**
           * Dates Firestore
           */
          createdAt:
            new Date(),

          updatedAt:
            new Date(),
        }
      );

    console.log(
      "✅ Paiement enregistré dans Firestore."
    );

    console.log(
      "Firestore document ID :",
      paymentDoc.id
    );

    console.log("=================================");

    /**
     * =====================================================
     * 16. RÉPONSE AU FRONTEND
     * =====================================================
     */
    return res.status(200).json({
      success: true,

      message:
        "Paiement initié. Veuillez confirmer sur votre téléphone.",

      reference:
        data.Reference,

      transactionId:
        data.Transaction_id ||
        null,

      /**
       * ID exact du document Firestore.
       *
       * Le frontend l'utilisera pour écouter
       * les changements en temps réel.
       */
      paymentId:
        paymentDoc.id,

      /**
       * Attention :
       * Status = réception de la demande.
       * Ce n'est PAS le résultat final.
       */
      status:
        "pending",
    });
  } catch (error: any) {
    /**
     * =====================================================
     * 17. ERREUR GÉNÉRALE
     * =====================================================
     */
    console.error(
      "❌ Erreur paiement GoFreshPay :",
      error?.response?.data ||
        error?.message ||
        error
    );

    const providerStatus =
      error?.response?.status;

    const statusCode =
      providerStatus >= 400 &&
      providerStatus < 500
        ? providerStatus
        : 500;

    return res.status(
      statusCode
    ).json({
      success: false,

      error:
        "Erreur lors du paiement",

      details:
        error?.response?.data ||
        null,
    });
  }
}