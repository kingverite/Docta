import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";

import {
  doc,
  onSnapshot,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

/**
 * =====================================================
 * RÉPONSE DE L'API DE PAIEMENT
 * =====================================================
 */
type PaymentResponse = {
  success?: boolean;
  message?: string;
  reference?: string;
  transactionId?: string;
  paymentId?: string;
  status?: string;
  error?: string;
  details?: unknown;
};

/**
 * =====================================================
 * TYPE DU DOCUMENT FIRESTORE
 * =====================================================
 */
type PaymentFirestore = {
  status?: string;
  statusLabel?: string;

  Status?: string;
  Trans_Status?: string;
  Trans_Status_Description?: string;

  reference?: string;
  Transaction_id?: string;

  amount?: number;
  phone?: string;
};

export default function Paiement() {
  /**
   * =====================================================
   * DONNÉES DU FORMULAIRE
   * =====================================================
   */
  const [phone, setPhone] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [telecom, setTelecom] =
    useState("MP");

  const [firstname, setFirstname] =
    useState("");

  const [lastname, setLastname] =
    useState("");

  const [email, setEmail] =
    useState("");

  /**
   * =====================================================
   * ÉTAT DE CHARGEMENT
   * =====================================================
   */
  const [loading, setLoading] =
    useState(false);

  /**
   * =====================================================
   * MESSAGES
   * =====================================================
   */
  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  /**
   * =====================================================
   * INFORMATIONS TRANSACTION
   * =====================================================
   */
  const [reference, setReference] =
    useState("");

  const [transactionId, setTransactionId] =
    useState("");

  /**
   * ID DU DOCUMENT FIRESTORE
   *
   * C'est cet ID qui nous permet d'écouter
   * précisément la transaction actuelle.
   */
  const [paymentId, setPaymentId] =
    useState("");

  /**
   * =====================================================
   * STATUT DE LA TRANSACTION
   * =====================================================
   */
  const [paymentStatus, setPaymentStatus] =
    useState("");

  const [paymentStatusLabel, setPaymentStatusLabel] =
    useState("");

  /**
   * =====================================================
   * 1. ÉCOUTE FIRESTORE EN TEMPS RÉEL
   * =====================================================
   *
   * Dès que webhook.ts modifie le document,
   * cette fonction reçoit automatiquement la modification.
   */
  useEffect(() => {
    /**
     * Aucun paiement à écouter.
     */
    if (!paymentId) {
      return;
    }

    console.log(
      "👂 Écoute Firestore du paiement :",
      paymentId
    );

    /**
     * Référence du document Firestore.
     */
    const paymentRef = doc(
      db,
      "paiements",
      paymentId
    );

    /**
     * Écoute en temps réel.
     */
    const unsubscribe =
      onSnapshot(
        paymentRef,
        (snapshot) => {
          /**
           * Le document n'existe plus.
           */
          if (!snapshot.exists()) {
            console.log(
              "⚠️ Document paiement introuvable."
            );

            return;
          }

          const data =
            snapshot.data() as PaymentFirestore;

          console.log(
            "📡 Mise à jour paiement Firestore :",
            data
          );

          /**
           * =================================================
           * STATUT
           * =================================================
           */
          if (data.status) {
            setPaymentStatus(
              data.status
            );
          }

          /**
           * =================================================
           * LABEL
           * =================================================
           */
          if (data.statusLabel) {
            setPaymentStatusLabel(
              data.statusLabel
            );
          }

          /**
           * =================================================
           * RÉFÉRENCE
           * =================================================
           */
          if (data.reference) {
            setReference(
              data.reference
            );
          }

          /**
           * =================================================
           * TRANSACTION ID
           * =================================================
           */
          if (data.Transaction_id) {
            setTransactionId(
              data.Transaction_id
            );
          }

          /**
           * =================================================
           * PAIEMENT RÉUSSI
           * =================================================
           */
          if (
            data.status ===
            "success"
          ) {
            console.log(
              "✅ Paiement confirmé."
            );

            setLoading(false);

            setMessage(
              "Votre paiement a été confirmé avec succès."
            );

            setError("");
          }

          /**
           * =================================================
           * PAIEMENT ÉCHOUÉ
           * =================================================
           */
          if (
            data.status ===
            "failed"
          ) {
            console.log(
              "❌ Paiement échoué."
            );

            setLoading(false);

            setError(
              "Le paiement a échoué ou a été annulé. Vous pouvez effectuer une nouvelle tentative."
            );

            setMessage("");
          }

          /**
           * =================================================
           * PAIEMENT TOUJOURS EN ATTENTE
           * =================================================
           */
          if (
            data.status ===
            "pending"
          ) {
            setLoading(false);

            setMessage(
              "Paiement en attente. Veuillez confirmer la transaction sur votre téléphone."
            );

            setError("");
          }
        },
        (snapshotError) => {
          console.error(
            "❌ Erreur écoute Firestore :",
            snapshotError
          );
        }
      );

    /**
     * Nettoyage de l'écoute lorsque le composant
     * change ou est démonté.
     */
    return () => {
      console.log(
        "🛑 Arrêt écoute paiement :",
        paymentId
      );

      unsubscribe();
    };
  }, [paymentId]);

  /**
   * =====================================================
   * 2. FONCTION DE PAIEMENT
   * =====================================================
   */
  const handlePayment = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    /**
     * Réinitialisation des messages.
     */
    setError("");
    setMessage("");

    setReference("");
    setTransactionId("");

    setPaymentId("");
    setPaymentStatus("");
    setPaymentStatusLabel("");

    /**
     * ===================================================
     * NETTOYER LE NUMÉRO
     * ===================================================
     */
    let customerPhone =
      phone
        .replace(/\s+/g, "")
        .trim();

    /**
     * Transformer :
     *
     * 0970000000
     *
     * en :
     *
     * 243970000000
     */
    if (
      /^0\d{9}$/.test(
        customerPhone
      )
    ) {
      customerPhone =
        "243" +
        customerPhone.substring(
          1
        );
    }

    /**
     * ===================================================
     * VALIDATION NUMÉRO
     * ===================================================
     */
    if (
      !/^243\d{9}$/.test(
        customerPhone
      )
    ) {
      setError(
        "Numéro invalide. Exemple : 0970000000"
      );

      return;
    }

    /**
     * ===================================================
     * VALIDATION MONTANT
     * ===================================================
     */
    const numericAmount =
      Number(amount);

    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {
      setError(
        "Veuillez saisir un montant valide."
      );

      return;
    }

    /**
     * ===================================================
     * VALIDATION OPÉRATEUR
     * ===================================================
     */
    if (!telecom) {
      setError(
        "Veuillez sélectionner un opérateur."
      );

      return;
    }

    /**
     * ===================================================
     * LANCEMENT
     * ===================================================
     */
    setLoading(true);

    try {
      /**
       * =================================================
       * APPEL API
       * =================================================
       */
      const response =
        await axios.post<PaymentResponse>(
          "/api/apiPayment",
          {
            phone:
              customerPhone,

            amount:
              numericAmount,

            telecom,

            firstname:
              firstname.trim() ||
              "Client",

            lastname:
              lastname.trim() ||
              "Client",

            email:
              email.trim() ||
              "client@example.com",
          }
        );

      const data =
        response.data;

      console.log(
        "📥 Réponse API paiement :",
        data
      );

      /**
       * =================================================
       * MESSAGE INITIAL
       * =================================================
       */
      setMessage(
        data.message ||
          "Paiement initié. Veuillez confirmer sur votre téléphone."
      );

      /**
       * =================================================
       * RÉFÉRENCE
       * =================================================
       */
      if (data.reference) {
        setReference(
          data.reference
        );
      }

      /**
       * =================================================
       * TRANSACTION ID
       * =================================================
       */
      if (
        data.transactionId
      ) {
        setTransactionId(
          data.transactionId
        );
      }

      /**
       * =================================================
       * ID FIRESTORE
       * =================================================
       *
       * Très important :
       *
       * On commence maintenant à écouter
       * le document correspondant.
       */
      if (data.paymentId) {
        setPaymentId(
          data.paymentId
        );
      }

      /**
       * Le montant peut être vidé après
       * le lancement de la transaction.
       */
      setAmount("");

      /**
       * Nous ne mettons pas loading à false
       * ici immédiatement pour l'utilisateur.
       *
       * L'écoute Firestore prendra le relais.
       */
    } catch (err: any) {
      console.error(
        "❌ Erreur frontend paiement :",
        err?.response?.data ||
          err
      );

      /**
       * =================================================
       * ERREUR 409
       * =================================================
       *
       * Exemple :
       *
       * Une transaction est encore pending.
       */
      setError(
        err?.response?.data?.error ||
          "Une erreur de connexion est survenue. Veuillez réessayer."
      );

      setMessage("");

      /**
       * Dans ce cas l'appel API est terminé.
       */
      setLoading(false);
    }
  };

  /**
   * =====================================================
   * 3. PERMETTRE UN NOUVEAU PAIEMENT
   * =====================================================
   *
   * Après success ou failed, nous pouvons
   * réinitialiser l'état de la transaction.
   *
   * Les informations personnelles restent dans
   * le formulaire.
   */
  const handleNewPayment = () => {
    setMessage("");
    setError("");

    setReference("");
    setTransactionId("");

    setPaymentId("");

    setPaymentStatus("");
    setPaymentStatusLabel("");

    setAmount("");

    setLoading(false);

    console.log(
      "🔄 Nouvelle transaction autorisée."
    );
  };

  return (
    <main className="payment-page">
      <div className="payment-card">

        <h1>
          Effectuer un paiement
        </h1>

        <p className="subtitle">
          Paiement sécurisé par mobile money
        </p>

        <form
          onSubmit={
            handlePayment
          }
        >

          {/* =================================================
              PRÉNOM
          ================================================= */}
          <div className="form-group">
            <label htmlFor="firstname">
              Prénom
            </label>

            <input
              id="firstname"
              type="text"
              value={
                firstname
              }
              onChange={(e) =>
                setFirstname(
                  e.target.value
                )
              }
              placeholder="Votre prénom"
            />
          </div>

          {/* =================================================
              NOM
          ================================================= */}
          <div className="form-group">
            <label htmlFor="lastname">
              Nom
            </label>

            <input
              id="lastname"
              type="text"
              value={
                lastname
              }
              onChange={(e) =>
                setLastname(
                  e.target.value
                )
              }
              placeholder="Votre nom"
            />
          </div>

          {/* =================================================
              EMAIL
          ================================================= */}
          <div className="form-group">
            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              placeholder="exemple@gmail.com"
            />
          </div>

          {/* =================================================
              OPÉRATEUR
          ================================================= */}
          <div className="form-group">
            <label htmlFor="telecom">
              Opérateur
            </label>

            <select
              id="telecom"
              value={
                telecom
              }
              onChange={(e) =>
                setTelecom(
                  e.target.value
                )
              }
            >
              <option value="MP">
                M-Pesa
              </option>

              <option value="AM">
                Airtel Money
              </option>

              <option value="OM">
                Orange Money
              </option>

              <option value="AF">
                Afrimoney
              </option>
            </select>
          </div>

          {/* =================================================
              NUMÉRO
          ================================================= */}
          <div className="form-group">
            <label htmlFor="phone">
              Numéro de téléphone
            </label>

            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) =>
                setPhone(
                  e.target.value
                )
              }
              placeholder="0970000000"
              required
            />

            <small>
              Exemple :
              0970000000
            </small>
          </div>

          {/* =================================================
              MONTANT
          ================================================= */}
          <div className="form-group">
            <label htmlFor="amount">
              Montant
            </label>

            <div className="amount-container">

              <input
                id="amount"
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                value={amount}
                onChange={(e) =>
                  setAmount(
                    e.target.value
                  )
                }
                placeholder="5000"
                required
              />

              <span>
                CDF
              </span>

            </div>
          </div>

          {/* =================================================
              STATUT EN TEMPS RÉEL
          ================================================= */}
          {paymentStatus ===
            "pending" && (
            <div className="message pending">

              <strong>
                ⏳ Paiement en cours
              </strong>

              <p>
                {paymentStatusLabel ||
                  "Veuillez confirmer la transaction sur votre téléphone."}
              </p>

              <p>
                Nous attendons la confirmation de
                l'opérateur.
              </p>

            </div>
          )}

          {/* =================================================
              SUCCÈS
          ================================================= */}
          {paymentStatus ===
            "success" && (
            <div className="message success">

              <strong>
                ✅ Paiement réussi
              </strong>

              <p>
                Votre paiement a été confirmé avec succès.
              </p>

              {reference && (
                <p>
                  <strong>
                    Référence :
                  </strong>{" "}
                  {reference}
                </p>
              )}

              {transactionId && (
                <p>
                  <strong>
                    Transaction :
                  </strong>{" "}
                  {transactionId}
                </p>
              )}

              <button
                type="button"
                className="new-payment-button"
                onClick={
                  handleNewPayment
                }
              >
                Effectuer un autre paiement
              </button>

            </div>
          )}

          {/* =================================================
              ÉCHEC
          ================================================= */}
          {paymentStatus ===
            "failed" && (
            <div className="message error">

              <strong>
                ❌ Paiement échoué
              </strong>

              <p>
                Le paiement a échoué ou a été annulé.
              </p>

              {reference && (
                <p>
                  <strong>
                    Référence :
                  </strong>{" "}
                  {reference}
                </p>
              )}

              <button
                type="button"
                className="retry-button"
                onClick={
                  handleNewPayment
                }
              >
                Réessayer
              </button>

            </div>
          )}

          {/* =================================================
              ERREUR API
          ================================================= */}
          {error &&
            paymentStatus !==
              "failed" && (
              <div className="message error">
                {error}
              </div>
            )}

          {/* =================================================
              MESSAGE INITIAL
          ================================================= */}
          {message &&
            !paymentStatus && (
              <div className="message success">

                <strong>
                  Paiement initié
                </strong>

                <p>
                  {message}
                </p>

                {reference && (
                  <p>
                    <strong>
                      Référence :
                    </strong>{" "}
                    {reference}
                  </p>
                )}

                {transactionId && (
                  <p>
                    <strong>
                      Transaction :
                    </strong>{" "}
                    {transactionId}
                  </p>
                )}

                <p>
                  Veuillez confirmer la transaction
                  sur votre téléphone.
                </p>

              </div>
          )}

          {/* =================================================
              BOUTON PAYER
          ================================================= */}
          {paymentStatus !==
            "success" &&
            paymentStatus !==
              "failed" && (
            <button
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Traitement..."
                : "Payer maintenant"}
            </button>
          )}

        </form>
      </div>

      <style jsx>{`
        .payment-page {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          background: #f4f6f8;
          box-sizing: border-box;
        }

        .payment-card {
          width: 100%;
          max-width: 450px;
          background: #ffffff;
          padding: 30px;
          border-radius: 14px;
          box-shadow:
            0 5px 25px rgba(0, 0, 0, 0.08);
          box-sizing: border-box;
        }

        h1 {
          margin: 0;
          text-align: center;
          font-size: 28px;
          color: #222;
        }

        .subtitle {
          margin: 8px 0 25px;
          text-align: center;
          color: #777;
          font-size: 14px;
        }

        .form-group {
          margin-bottom: 18px;
        }

        label {
          display: block;
          margin-bottom: 7px;
          font-size: 15px;
          font-weight: 600;
          color: #333;
        }

        input,
        select {
          width: 100%;
          height: 46px;
          padding: 0 12px;
          border: 1px solid #d5d5d5;
          border-radius: 7px;
          background: #fff;
          font-size: 16px;
          box-sizing: border-box;
          outline: none;
        }

        input:focus,
        select:focus {
          border-color: #007bff;
        }

        small {
          display: block;
          margin-top: 5px;
          color: #777;
          font-size: 12px;
        }

        .amount-container {
          position: relative;
        }

        .amount-container input {
          padding-right: 55px;
        }

        .amount-container span {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #666;
          font-weight: 600;
          font-size: 14px;
        }

        button {
          width: 100%;
          height: 48px;
          margin-top: 5px;
          border: none;
          border-radius: 7px;
          background: #007bff;
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }

        button:hover:not(:disabled) {
          opacity: 0.9;
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .message {
          margin-bottom: 18px;
          padding: 14px;
          border-radius: 7px;
          font-size: 14px;
        }

        .message p {
          margin: 6px 0;
        }

        .success {
          background: #e8f8ed;
          color: #176b2c;
          border: 1px solid #bce8c7;
        }

        .pending {
          background: #fff8e1;
          color: #765800;
          border: 1px solid #f0d98a;
        }

        .error {
          background: #ffe8e8;
          color: #b00020;
          border: 1px solid #ffcaca;
        }

        .new-payment-button {
          margin-top: 14px;
          background: #16803c;
        }

        .retry-button {
          margin-top: 14px;
          background: #007bff;
        }

        @media (max-width: 500px) {
          .payment-page {
            padding: 10px;
          }

          .payment-card {
            padding: 22px;
          }

          h1 {
            font-size: 24px;
          }
        }
      `}</style>
    </main>
  );
}