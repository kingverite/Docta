import { useState } from "react";
import styles from "@/styles/Form.module.css";

export default function PaiementVisa() {
  const [form, setForm] = useState({
    amount: "",
    currency: "USD",

    firstname: "",
    lastname: "",
    email: "",
    phone: "",

    address: "",
    city: "",
    country: "CD",
    state: "",
    postalCode: "",
  });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/cardPayment",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            ...form,
            amount: Number(form.amount),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Impossible d'initialiser le paiement."
        );
      }

      if (!data.paymentUrl) {
        throw new Error(
          "Lien de paiement Moko introuvable."
        );
      }

      // Redirection vers le Checkout Moko
      window.location.href =
        data.paymentUrl;
    } catch (error: any) {
      console.error(error);

      setError(
        error?.message ||
          "Une erreur est survenue."
      );

      setLoading(false);
    }
  };

  return (
    <div className={styles.containerVisa}>
      <div className={styles.cardVisa}>
        <h1>Paiement par carte Visa</h1>

        <p className={styles.infoVisa}>
          Vous serez redirigé vers une page
          sécurisée pour saisir les informations
          de votre carte.
        </p>

        <form onSubmit={handleSubmit}>
          <div className={styles.row}>
            <div>
              <label>Montant</label>

              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                min={
                  form.currency === "USD"
                    ? "1"
                    : "3000"
                }
                step="0.01"
                required
              />
            </div>

            <div>
              <label>Devise</label>

              <select
                name="currency"
                value={form.currency}
                onChange={handleChange}
              >
                <option value="USD">
                  USD
                </option>

                <option value="CDF">
                  CDF
                </option>
              </select>
            </div>
          </div>

          <label>Prénom</label>

          <input
            type="text"
            name="firstname"
            value={form.firstname}
            onChange={handleChange}
            required
          />

          <label>Nom</label>

          <input
            type="text"
            name="lastname"
            value={form.lastname}
            onChange={handleChange}
            required
          />

          <label>Email</label>

          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <label>Téléphone</label>

          <input
            type="tel"
            name="phone"
            placeholder="+243..."
            value={form.phone}
            onChange={handleChange}
            required
          />

          <label>Adresse</label>

          <input
            type="text"
            name="address"
            value={form.address}
            onChange={handleChange}
            required
          />

          <label>Ville</label>

          <input
            type="text"
            name="city"
            value={form.city}
            onChange={handleChange}
            required
          />

          <label>Pays</label>

          <select
            name="country"
            value={form.country}
            onChange={handleChange}
          >
            <option value="CD">
              République démocratique du Congo
            </option>

            <option value="US">
              États-Unis
            </option>

            <option value="FR">
              France
            </option>

            <option value="BE">
              Belgique
            </option>

            <option value="CA">
              Canada
            </option>
          </select>

          <label>
            Province / État
          </label>

          <input
            type="text"
            name="state"
            value={form.state}
            onChange={handleChange}
          />

          <label>Code postal</label>

          <input
            type="text"
            name="postalCode"
            value={form.postalCode}
            onChange={handleChange}
          />

          {error && (
            <div className={styles.errorVisa}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Préparation du paiement..."
              : "Payer avec Visa"}
          </button>
        </form>
      </div>
    </div>
  );
}