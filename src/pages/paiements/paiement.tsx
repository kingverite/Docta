import { useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";

type PaymentResponse = {
  success?: boolean;
  message?: string;
  reference?: string;
  transactionId?: string;
  status?: string;
  error?: string;
  details?: unknown;
};

export default function Paiement() {
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [telecom, setTelecom] = useState("MP");

  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [reference, setReference] = useState("");
  const [transactionId, setTransactionId] =
    useState("");

  const handlePayment = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setMessage("");
    setReference("");
    setTransactionId("");

    // ===================================================
    // 1. NETTOYER LE NUMÉRO
    // ===================================================

    let customerPhone = phone
      .replace(/\s+/g, "")
      .trim();

    if (/^0\d{9}$/.test(customerPhone)) {
      customerPhone =
        "243" + customerPhone.substring(1);
    }

    // ===================================================
    // 2. VALIDATION
    // ===================================================

    if (!/^243\d{9}$/.test(customerPhone)) {
      setError(
        "Numéro invalide. Exemple : 0970000000"
      );
      return;
    }

    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setError("Veuillez saisir un montant valide.");
      return;
    }

    if (!telecom) {
      setError(
        "Veuillez sélectionner un opérateur."
      );
      return;
    }

    // ===================================================
    // 3. PAIEMENT
    // ===================================================

    setLoading(true);

    try {
      const response = await axios.post<PaymentResponse>(
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
            email.trim() ||
            "client@example.com",
        }
      );

      const data = response.data;

      console.log(
        "Réponse API paiement :",
        data
      );

      // =================================================
      // 4. SUCCÈS
      // =================================================

      setMessage(
        data.message ||
          "Paiement initié avec succès."
      );

      if (data.reference) {
        setReference(data.reference);
      }

      if (data.transactionId) {
        setTransactionId(
          data.transactionId
        );
      }

      setAmount("");

    } catch (err: any) {
      console.error(
        "Erreur frontend paiement :",
        err?.response?.data || err
      );

      // =================================================
      // 5. ERREUR API
      // =================================================

      setError(
        err?.response?.data?.error ||
          "Une erreur de connexion est survenue. Veuillez réessayer."
      );

    } finally {
      setLoading(false);
    }
  };

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
                setTelecom(e.target.value)
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

          {/* NUMÉRO */}
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
                setPhone(e.target.value)
              }
              placeholder="0970000000"
              required
            />

            <small>
              Exemple : 0970000000
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

          {/* ERREUR */}
          {error && (
            <div className="message error">
              {error}
            </div>
          )}

          {/* SUCCÈS */}
          {message && (
            <div className="message success">
              <strong>
                Paiement initié
              </strong>

              <p>{message}</p>

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
                Veuillez confirmer la
                transaction sur votre téléphone.
              </p>
            </div>
          )}

          {/* BOUTON */}
          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Traitement..."
              : "Payer maintenant"}
          </button>

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

        .error {
          background: #ffe8e8;
          color: #b00020;
          border: 1px solid #ffcaca;
        }

        .success {
          background: #e8f8ed;
          color: #176b2c;
          border: 1px solid #bce8c7;
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