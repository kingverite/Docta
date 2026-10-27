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
  transactionId?: string | null;
  paymentId?: string;
  status?: string;
  error?: string;
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

/**
 * =====================================================
 * RÉPONSE D'ERREUR HTTP
 * =====================================================
 */
type ApiErrorResponse = {
  success?: boolean;
  error?: string;
  message?: string;
  reference?: string;
  paymentId?: string;
};

type TelecomCode = "MP" | "AM" | "OM" | "AF";

const OPERATORS: Record<
  TelecomCode,
  {
    label: string;
    placeholder: string;
    help: string;
    error: string;
  }
> = {
  MP: {
    label: "M-Pesa",
    placeholder: "243970000000",
    help: "M-Pesa : 243 suivi de 9 chiffres.",
    error:
      "Numéro M-Pesa invalide. Utilisez 243 suivi de 9 chiffres. Exemple : 243970000000.",
  },

  AM: {
    label: "Airtel Money",
    placeholder: "0970000000",
    help: "Airtel Money : 0 suivi de 9 chiffres.",
    error:
      "Numéro Airtel Money invalide. Utilisez 0 suivi de 9 chiffres. Exemple : 0970000000.",
  },

  OM: {
    label: "Orange Money",
    placeholder: "0840000000",
    help: "Orange Money : 0 suivi de 9 chiffres.",
    error:
      "Numéro Orange Money invalide. Utilisez 0 suivi de 9 chiffres. Exemple : 0840000000.",
  },

  AF: {
    label: "Afrimoney",
    placeholder: "0900000000",
    help: "Afrimoney : 0 suivi de 9 chiffres.",
    error:
      "Numéro Afrimoney invalide. Utilisez 0 suivi de 9 chiffres. Exemple : 0900000000.",
  },
};

/**
 * =====================================================
 * VALIDATION DU NUMÉRO
 * Doit correspondre à apiPayment.ts.
 * =====================================================
 */
function validatePhone(
  phone: string,
  telecom: TelecomCode
): boolean {
  if (telecom === "MP") {
    return /^243\d{9}$/.test(phone);
  }

  if (
    telecom === "AM" ||
    telecom === "OM" ||
    telecom === "AF"
  ) {
    return /^0\d{9}$/.test(phone);
  }

  return false;
}

export default function Paiement() {
  /**
   * =====================================================
   * DONNÉES DU FORMULAIRE
   * =====================================================
   */
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [telecom, setTelecom] =
    useState<TelecomCode>("MP");

  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");

  /**
   * =====================================================
   * ÉTAT DE CHARGEMENT
   * =====================================================
   */
  const [loading, setLoading] = useState(false);

  /**
   * =====================================================
   * MESSAGES
   * =====================================================
   */
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /**
   * =====================================================
   * INFORMATIONS DE TRANSACTION
   * =====================================================
   */
  const [reference, setReference] = useState("");
  const [transactionId, setTransactionId] =
    useState("");
  const [paymentId, setPaymentId] = useState("");

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
   * L'API retourne paymentId après avoir créé le
   * document dans la collection "paiements".
   *
   * Ce composant écoute ensuite précisément ce document.
   */
  useEffect(() => {
    if (!paymentId) {
      return;
    }

    console.log(
      "Écoute Firestore du paiement :",
      paymentId
    );

    const paymentRef = doc(
      db,
      "paiements",
      paymentId
    );

    const unsubscribe = onSnapshot(
      paymentRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          console.warn(
            "Document de paiement introuvable."
          );
          return;
        }

        const data =
          snapshot.data() as PaymentFirestore;

        console.log(
          "Mise à jour Firestore :",
          data
        );

        if (data.status) {
          setPaymentStatus(data.status);
        }

        if (data.statusLabel) {
          setPaymentStatusLabel(data.statusLabel);
        }

        if (data.reference) {
          setReference(data.reference);
        }

        if (data.Transaction_id) {
          setTransactionId(data.Transaction_id);
        }

        /**
         * PAIEMENT RÉUSSI
         */
        if (data.status === "success") {
          setLoading(false);
          setMessage(
            "Votre paiement a été confirmé avec succès."
          );
          setError("");
        }

        /**
         * PAIEMENT ÉCHOUÉ
         */
        if (data.status === "failed") {
          setLoading(false);
          setMessage("");
          setError(
            "Le paiement a échoué ou a été annulé. Vous pouvez effectuer une nouvelle tentative."
          );
        }

        /**
         * PAIEMENT EN ATTENTE
         */
        if (data.status === "pending") {
          setLoading(false);
          setError("");
          setMessage(
            "Demande envoyée. Veuillez confirmer le paiement sur votre téléphone."
          );
        }
      },
      (snapshotError) => {
        console.error(
          "Erreur d'écoute Firestore :",
          snapshotError
        );
      }
    );

    return () => {
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

    if (loading) {
      return;
    }

    setError("");
    setMessage("");

    setReference("");
    setTransactionId("");
    setPaymentId("");

    setPaymentStatus("");
    setPaymentStatusLabel("");

    /**
     * NETTOYER LE NUMÉRO
     *
     * Les espaces sont supprimés.
     * Le préfixe du numéro reste inchangé.
     */
    const customerPhone = phone
      .replace(/\s+/g, "")
      .trim();

    /**
     * VALIDATION DE L'OPÉRATEUR
     */
    if (!Object.prototype.hasOwnProperty.call(
      OPERATORS,
      telecom
    )) {
      setError(
        "Veuillez sélectionner un opérateur valide."
      );
      return;
    }

    /**
     * VALIDATION DU NUMÉRO
     *
     * Les formats sont identiques à ceux
     * définis dans apiPayment.ts.
     */
    if (!validatePhone(customerPhone, telecom)) {
      setError(OPERATORS[telecom].error);
      return;
    }

    /**
     * VALIDATION DU MONTANT
     */
    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setError(
        "Veuillez saisir un montant valide."
      );
      return;
    }

    /**
     * LANCEMENT DE LA DEMANDE
     */
    setLoading(true);

    try {
      /**
       * APPEL À L'API NEXT.JS
       *
       * L'API reçoit :
       * - phone
       * - amount
       * - telecom
       * - firstname
       * - lastname
       * - email
       */
      const response =
        await axios.post<PaymentResponse>(
          "/api/apiPayment",
          {
            phone: customerPhone,
            amount: numericAmount,
            telecom,
            firstname:
              firstname.trim() || "Client",
            lastname:
              lastname.trim() || "Client",
            email:
              email.trim() || "client@example.com",
          }
        );

      const data = response.data;

      console.log(
        "Réponse de apiPayment :",
        data
      );

      /**
       * RÉCUPÉRER LES INFORMATIONS RETOURNÉES
       */
      if (data.reference) {
        setReference(data.reference);
      }

      if (data.transactionId) {
        setTransactionId(data.transactionId);
      }

      if (data.paymentId) {
        setPaymentId(data.paymentId);
      }

      setMessage(
        data.message ||
          "Demande envoyée. Veuillez confirmer le paiement sur votre téléphone."
      );

      /**
       * Vider le montant après l'initialisation.
       */
      setAmount("");

      /**
       * Sans paymentId, le composant ne peut pas
       * écouter le document Firestore.
       */
      if (!data.paymentId) {
        setLoading(false);
      }
    } catch (err: unknown) {
if (
    typeof err === "object" &&
    err !== null &&
    "response" in err
  ) {
    const response = (
      err as {
        response?: {
          status?: number;
          data?: unknown;
        };
      }
    ).response;

    console.error(
      "STATUT HTTP :",
      response?.status
    );

    console.error(
      "RÉPONSE API COMPLÈTE :",
      JSON.stringify(response?.data, null, 2)
    );
  } else {
    console.error(
      "ERREUR PAIEMENT :",
      err
    );
  }

  // Conserve ici le reste de ton catch actuel.
      
      console.error(
        "Erreur frontend paiement :",
        err
      );

      let errorMessage =
        "Une erreur est survenue lors de la demande de paiement.";

      if (err instanceof Error) {
  errorMessage = err.message;
}

if (
  typeof err === "object" &&
  err !== null &&
  "response" in err
) {
  const response = (
    err as {
      response?: {
        data?: ApiErrorResponse;
      };
    }
  ).response;

  const responseData = response?.data;

  errorMessage =
    responseData?.error ||
    responseData?.message ||
    errorMessage;

  if (responseData?.paymentId) {
    setPaymentId(responseData.paymentId);
    setReference(responseData.reference || "");

    setMessage(
      "Le résultat de l'initialisation est incertain. Nous vérifions le statut de la transaction. Ne relancez pas le paiement immédiatement."
    );

    setError("");
    setLoading(false);
    return;
  }
}

      setError(errorMessage);
      setMessage("");
      setLoading(false);
    }
  };

  /**
   * =====================================================
   * 3. NOUVEAU PAIEMENT
   * =====================================================
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

    /**
     * Les informations personnelles et le numéro
     * restent disponibles dans le formulaire.
     */
  };

  /**
   * =====================================================
   * 4. FORMULAIRE
   * =====================================================
   */
  return (
    <main className="payment-page">
      <div className="payment-card">
        <h1>Effectuer un paiement</h1>

        <p className="subtitle">
          Paiement sécurisé par mobile money
        </p>

        <form onSubmit={handlePayment}>
          {/* PRÉNOM */}
          <div className="form-group">
            <label htmlFor="firstname">
              Prénom
            </label>

            <input
              id="firstname"
              type="text"
              value={firstname}
              onChange={(e) =>
                setFirstname(e.target.value)
              }
              placeholder="Votre prénom"
            />
          </div>

          {/* NOM */}
          <div className="form-group">
            <label htmlFor="lastname">
              Nom
            </label>

            <input
              id="lastname"
              type="text"
              value={lastname}
              onChange={(e) =>
                setLastname(e.target.value)
              }
              placeholder="Votre nom"
            />
          </div>

          {/* EMAIL */}
          <div className="form-group">
            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="exemple@gmail.com"
            />
          </div>

          {/* OPÉRATEUR */}
          <div className="form-group">
            <label htmlFor="telecom">
              Opérateur
            </label>

            <select
              id="telecom"
              value={telecom}
              onChange={(e) =>
                setTelecom(
                  e.target.value as TelecomCode
                )
              }
              required
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

          {/* NUMÉRO */}
          <div className="form-group">
            <label htmlFor="phone">
              Numéro de téléphone
            </label>

            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value)
              }
              placeholder={OPERATORS[telecom].placeholder}
              required
            />

            <small>
              {OPERATORS[telecom].help}
            </small>
          </div>

          {/* MONTANT */}
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
                  setAmount(e.target.value)
                }
                placeholder="5000"
                required
              />

              <span>CDF</span>
            </div>
          </div>

          {/* MESSAGE GÉNÉRAL */}
          {message &&
            paymentStatus !== "pending" &&
            paymentStatus !== "success" &&
            paymentStatus !== "failed" && (
              <div className="message pending" role="status">
                {message}
              </div>
            )}

          {/* EN ATTENTE */}
          {paymentStatus === "pending" && (
            <div className="message pending" role="status">
              <strong>
                ⏳ Paiement en attente
              </strong>

              <p>
                {paymentStatusLabel ||
                  "Veuillez confirmer la transaction sur votre téléphone."}
              </p>

              {reference && (
                <p>
                  <strong>Référence :</strong>{" "}
                  {reference}
                </p>
              )}
            </div>
          )}

          {/* SUCCÈS */}
          {paymentStatus === "success" && (
            <div className="message success" role="status">
              <strong>
                ✅ Paiement réussi
              </strong>

              <p>
                Votre paiement a été confirmé avec succès.
              </p>

              {reference && (
                <p>
                  <strong>Référence :</strong>{" "}
                  {reference}
                </p>
              )}

              {transactionId && (
                <p>
                  <strong>Transaction :</strong>{" "}
                  {transactionId}
                </p>
              )}

              <button
                type="button"
                className="new-payment-button"
                onClick={handleNewPayment}
              >
                Effectuer un autre paiement
              </button>
            </div>
          )}

          {/* ÉCHEC */}
          {paymentStatus === "failed" && (
            <div className="message error" role="alert">
              <strong>
                ❌ Paiement échoué
              </strong>

              <p>
                Le paiement a échoué ou a été annulé.
              </p>

              {reference && (
                <p>
                  <strong>Référence :</strong>{" "}
                  {reference}
                </p>
              )}

              <button
                type="button"
                className="retry-button"
                onClick={handleNewPayment}
              >
                Réessayer
              </button>
            </div>
          )}

          {/* ERREUR */}
          {error && (
            <div className="message error" role="alert">
              {error}
            </div>
          )}

          {/* BOUTON DE PAIEMENT */}
          {paymentStatus !== "success" &&
            paymentStatus !== "failed" && (
              <button
                type="submit"
                className="payment-button"
                disabled={loading}
              >
                {loading
                  ? "Traitement en cours..."
                  : "Payer maintenant"}
              </button>
            )}
        </form>
      </div>
    </main>
  );
}