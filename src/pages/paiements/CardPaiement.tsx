import React, { useState } from "react";

interface CardForm {
  amount: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
}

export default function CardPaiement() {
  const [form, setForm] = useState<CardForm>({
    amount: "",
    firstname: "",
    lastname: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "CD",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setError("");

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount < 1) {
      setError("Le montant minimum est de 1 USD.");
      return;
    }

    if (!/^[A-Za-z]{2}$/.test(form.country)) {
      setError("Veuillez saisir un code pays valide.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/CardPaiement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          amount,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Impossible d'initialiser le paiement."
        );
      }

      if (!result.checkoutUrl) {
        throw new Error("Lien de paiement FreshPay introuvable.");
      }

      window.location.assign(result.checkoutUrl);

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue."
      );

      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px",
    border: "1px solid #d9dfe7",
    borderRadius: "7px",
    fontSize: "14px",
    boxSizing: "border-box",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "7px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#344054",
  };

  return (
    <div style={{
      maxWidth: "520px",
      margin: "30px auto",
      padding: "25px",
      background: "#ffffff",
      borderRadius: "12px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      fontFamily: "Arial, sans-serif",
    }}>

      <h2 style={{
        textAlign: "center",
        color: "#172b4d",
        marginBottom: "8px",
      }}>
        Paiement par carte bancaire
      </h2>

      <p style={{
        textAlign: "center",
        color: "#667085",
        fontSize: "14px",
        marginBottom: "22px",
      }}>
        Réglez votre consultation en toute sécurité.
      </p>

      {/* Cartes acceptées */}

      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "12px",
        marginBottom: "25px",
      }}>

        <div style={{
          border: "1px solid #e2e8f0",
          borderRadius: "7px",
          padding: "9px 20px",
          fontWeight: 900,
          fontSize: "20px",
          fontStyle: "italic",
          color: "#1434CB",
        }}>
          VISA
        </div>

        <div style={{
          border: "1px solid #e2e8f0",
          borderRadius: "7px",
          padding: "9px 16px",
          display: "flex",
          alignItems: "center",
          gap: "3px",
          fontSize: "13px",
          fontWeight: 700,
        }}>
          <span style={{
            width: "23px",
            height: "23px",
            borderRadius: "50%",
            background: "#EB001B",
            display: "inline-block",
          }} />

          <span style={{
            width: "23px",
            height: "23px",
            borderRadius: "50%",
            background: "#F79E1B",
            display: "inline-block",
            marginLeft: "-10px",
          }} />

          <span>Mastercard</span>
        </div>

      </div>

      <form onSubmit={handleSubmit}>

        <div style={{ marginBottom: "18px" }}>
          <label style={labelStyle}>
            Montant à payer (USD)
          </label>

          <input
            type="number"
            name="amount"
            min="1"
            step="0.01"
            placeholder="Exemple : 50"
            value={form.amount}
            onChange={handleChange}
            style={inputStyle}
            required
          />
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginBottom: "18px",
        }}>

          <div>
            <label style={labelStyle}>Prénom</label>
            <input
              type="text"
              name="firstname"
              value={form.firstname}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Nom</label>
            <input
              type="text"
              name="lastname"
              value={form.lastname}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </div>

        </div>

        <div style={{ marginBottom: "18px" }}>
          <label style={labelStyle}>Adresse e-mail</label>

          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            style={inputStyle}
            required
          />
        </div>

        <div style={{ marginBottom: "18px" }}>
          <label style={labelStyle}>Téléphone</label>

          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            style={inputStyle}
            required
          />
        </div>

        <div style={{ marginBottom: "18px" }}>
          <label style={labelStyle}>Adresse</label>

          <input
            type="text"
            name="address"
            value={form.address}
            onChange={handleChange}
            style={inputStyle}
            required
          />
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginBottom: "22px",
        }}>

          <div>
            <label style={labelStyle}>Ville</label>

            <input
              type="text"
              name="city"
              value={form.city}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Pays (ISO)</label>

            <input
              type="text"
              name="country"
              maxLength={2}
              value={form.country}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </div>

        </div>

        {error && (
          <div style={{
            background: "#fff1f0",
            color: "#c62828",
            padding: "12px",
            borderRadius: "7px",
            marginBottom: "15px",
            fontSize: "14px",
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "15px",
            background: loading ? "#98a2b3" : "#1769aa",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontSize: "15px",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading
            ? "Préparation du paiement..."
            : "Continuer vers le paiement sécurisé"}
        </button>

      </form>

      <p style={{
        textAlign: "center",
        fontSize: "12px",
        color: "#667085",
        marginTop: "18px",
      }}>
        Paiement sécurisé par FreshPay.
        <br />
        Cartes Visa et Mastercard acceptées.
      </p>

    </div>
  );
}