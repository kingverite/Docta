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
 * Réponse GoFreshPay lors de l'initialisation
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
 * Réponse possible du Check Status API
 *
 * Le PDF indique que l'API verify peut retourner
 * Trans_Status : Submitted / Pending / Failed / Successful.
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
     * 2. RÉCUPÉRATION DES DONNÉES DU FORMULAIRE
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
     * 3. VÉRIFICATION DES DONNÉES OBLIGATOIRES
     * =====================================================
     */
    if (!phone || !amount || !telecom) {
      return res.status(400).json({
        error: "Données manquantes",
      });
    }

    /**
     * =====================================================
     * 4. VALIDATION DU NUMÉRO RDC
     * =====================================================
     *
     * Format attendu :
     *
     * 243XXXXXXXXX
     *
     * Exemple :
     * 243974703854
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
     *
     * IMPORTANT :
     *
     * GoFreshPay attend les valeurs en minuscules :
     *
     * mpesa
     * airtel
     * orange
     *
     * et non :
     *
     * Mpesa
     * Airtel
     * Orange
     *
     * Le PDF montre également "airtel" dans Method.
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

    console.log("Méthode GoFreshPay :", method);

    /**
     * =====================================================
     * 7. VÉRIFIER LES TRANSACTIONS EXISTANTES
     * =====================================================
     *
     * On cherche les paiements du même numéro qui sont
     * encore "pending".
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
     * 8. TRAITEMENT D'UNE ANCIENNE TRANSACTION PENDING
     * =====================================================
     *
     * Une ancienne transaction peut être restée "pending"
     * dans Firestore si le callback n'est pas encore arrivé.
     *
     * Dans ce cas, nous vérifions directement son statut
     * auprès de GoFreshPay avant de bloquer le nouveau paiement.
     */
    if (!pendingSnapshot.empty) {
      console.log(
        "⚠️ Une transaction pending existe déjà pour ce numéro."
      );

      /**
       * Nous traitons le premier paiement pending.
       */
      const pendingDoc = pendingSnapshot.docs[0];

      const pendingData = pendingDoc.data();

      const pendingReference =
        pendingData.reference;

      /**
       * Si nous avons une référence, nous pouvons utiliser
       * l'action verify de GoFreshPay.
       */
      if (pendingReference) {
        console.log(
          "🔎 Vérification GoFreshPay de :",
          pendingReference
        );

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

                reference: pendingReference,
              },
              {
                headers: {
                  "Content-Type": "application/json",
                },

                timeout: 30000,
              }
            );

          const verifyData = verifyRes.data;

          console.log(
            "📥 Vérification GoFreshPay :",
            verifyData
          );

          /**
           * =================================================
           * PAIEMENT RÉUSSI
           * =================================================
           */
          if (
            verifyData.Trans_Status ===
            "Successful"
          ) {
            await updateDoc(pendingDoc.ref, {
              status: "success",

              statusLabel:
                "Paiement réussi",

              Status:
                verifyData.Status || null,

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
                verifyData.Updated_at || null,

              updatedAt: new Date(),
            });

            return res.status(409).json({
              error:
                "Un paiement est déjà réussi pour ce numéro.",
            });
          }

          /**
           * =================================================
           * PAIEMENT ÉCHOUÉ
           * =================================================
           */
          if (
            verifyData.Trans_Status ===
            "Failed"
          ) {
            await updateDoc(pendingDoc.ref, {
              status: "failed",

              statusLabel:
                "Paiement échoué",

              Status:
                verifyData.Status || null,

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
                verifyData.Updated_at || null,

              updatedAt: new Date(),
            });

            console.log(
              "✅ Ancienne transaction échouée."
            );

            console.log(
              "➡️ Nouveau paiement autorisé."
            );
          }

          /**
           * =================================================
           * PAIEMENT ENCORE EN TRAITEMENT
           * =================================================
           *
           * Le PDF indique que Check Status peut retourner
           * Submitted ou Pending.
           */
          if (
            verifyData.Trans_Status ===
              "Pending" ||
            verifyData.Trans_Status ===
              "Submitted"
          ) {
            return res.status(409).json({
              error:
                "Une transaction est toujours en cours pour ce numéro. Veuillez attendre sa finalisation.",
            });
          }
        } catch (verifyError: any) {
          console.error(
            "❌ Erreur lors de la vérification GoFreshPay :",
            verifyError?.response?.data ||
              verifyError?.message ||
              verifyError
          );

          /**
           * Par sécurité, si nous ne pouvons pas connaître
           * le statut de l'ancienne transaction, nous ne
           * lançons PAS automatiquement une nouvelle
           * transaction.
           */
          return res.status(409).json({
            error:
              "Une transaction est déjà en cours pour ce numéro. Impossible de vérifier son statut pour le moment.",
          });
        }
      } else {
        /**
         * Une transaction pending sans référence est
         * anormale : on bloque par sécurité.
         */
        return res.status(409).json({
          error:
            "Une transaction est déjà en cours pour ce numéro.",
        });
      }
    }

    /**
     * =====================================================
     * 9. GÉNÉRATION DE LA RÉFÉRENCE
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
     * 10. VÉRIFICATION DES VARIABLES D'ENVIRONNEMENT
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
     * 11. PAYLOAD ENVOYÉ À GOFRESHPAY
     * =====================================================
     */
    const payload = {
      merchant_id:
        process.env.GOFRESHPAY_MERCHANT_ID,

      merchant_secrete:
        process.env.GOFRESHPAY_MERCHANT_SECRET,

      action: "debit",

      method,

      amount: String(numericAmount),

      currency: "CDF",

      customer_number: String(phone),

      reference,

      firstname:
        firstname || "Client",

      lastname:
        lastname || "Client",

      email:
        email || "client@example.com",

      callback_url:
        process.env.GOFRESHPAY_CALLBACK_URL,
    };

    /**
     * NE PAS afficher payload complet ici,
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
     * 12. ENVOI À GOFRESHPAY
     * =====================================================
     */
    const paymentRes =
      await axios.post<GoFreshPayResponse>(
        "https://api.gofreshpay.com/api/v1/gateway",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },

          timeout: 30000,
        }
      );

    const data = paymentRes.data;

    console.log(
      "📥 Réponse GoFreshPay :",
      data
    );

    /**
     * =====================================================
     * 13. VÉRIFIER LA RÉFÉRENCE
     * =====================================================
     */
    if (!data.Reference) {
      console.error(
        "❌ Réponse GoFreshPay sans Reference"
      );

      return res.status(502).json({
        error:
          "Réponse GoFreshPay invalide : Reference manquante",
      });
    }

    /**
     * =====================================================
     * 14. NOM DE L'OPÉRATEUR
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
     * 15. ENREGISTREMENT FIRESTORE
     * =====================================================
     *
     * IMPORTANT :
     *
     * Status = Success dans la réponse initiale ne veut
     * PAS dire que le paiement est réussi.
     *
     * On conserve donc :
     *
     * status: pending
     *
     * jusqu'au callback final.
     */
    await addDoc(
      collection(db, "paiements"),
      {
        /**
         * Informations client
         */
        phone: String(phone),

        firstname:
          firstname || null,

        lastname:
          lastname || null,

        email:
          email || null,

        /**
         * Informations paiement
         */
        amount: numericAmount,

        telecom,

        operatorName,

        reference: data.Reference,

        /**
         * Le paiement est encore en traitement.
         */
        status: "pending",

        statusLabel:
          "En attente",

        /**
         * Réponse initiale FreshPay
         */
        Status:
          data.Status || null,

        Comment:
          data.Comment || null,

        Customer_Number:
          data.Customer_Number || null,

        Currency:
          data.Currency || null,

        Transaction_id:
          data.Transaction_id || null,

        Created_At:
          data.Created_At || null,

        Updated_At:
          data.Updated_At || null,

        /**
         * Dates Firestore
         */
        createdAt: new Date(),

        updatedAt: new Date(),
      }
    );

    console.log(
      "✅ Paiement enregistré dans Firestore."
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
        data.Transaction_id || null,

      /**
       * ATTENTION :
       * ceci correspond au statut de réception de
       * la demande, pas au résultat final.
       */
      status:
        data.Status || "Pending",
    });
  } catch (error: any) {
    /**
     * =====================================================
     * 17. GESTION DES ERREURS
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

    /**
     * Si GoFreshPay renvoie une erreur 4xx,
     * on conserve son code.
     *
     * Sinon → 500.
     */
    const statusCode =
      providerStatus >= 400 &&
      providerStatus < 500
        ? providerStatus
        : 500;

    return res.status(statusCode).json({
      success: false,

      error:
        "Erreur lors du paiement",

      details:
        error?.response?.data || null,
    });
  }
}