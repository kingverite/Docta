import { useState } from "react";
import type {
  ChangeEvent,
  FormEvent,
} from "react";

import styles from "@/styles/Form.module.css";

type PaymentForm = {
  amount: string;
  currency: "USD";

  firstname: string;
  lastname: string;
  email: string;
  phone: string;

  address: string;
  city: string;
  country: string;

  state: string;
  postalCode: string;
};

type PaymentResponse = {
  success: boolean;
  message?: string;
  error?: string;

  paymentId?: string;
  reference?: string;
  transactionUuid?: string;
  paymentUrl?: string;
};

export default function PaiementVisa() {
  const [form, setForm] = useState<PaymentForm>({
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

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const handleChange = (
    e: ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      // ----------------------------------------------
      // 1. Vérifier le montant
      // ----------------------------------------------

      const amount = Number(form.amount);

      if (
        !Number.isFinite(amount) ||
        amount < 1
      ) {
        throw new Error(
          "Le montant minimum est de 1 USD."
        );
      }

      // ----------------------------------------------
      // 2. Vérifier les informations obligatoires
      // ----------------------------------------------

      const requiredFields = [
        form.firstname,
        form.lastname,
        form.email,
        form.phone,
        form.address,
        form.city,
        form.country,
      ];

      if (
        requiredFields.some(
          (value) => !value.trim()
        )
      ) {
        throw new Error(
          "Veuillez remplir tous les champs obligatoires."
        );
      }

      // ----------------------------------------------
      // 3. Vérifier le code pays
      // ----------------------------------------------

      if (!/^[A-Z]{2}$/i.test(form.country.trim())) {
        throw new Error(
          "Veuillez sélectionner un pays valide."
        );
      }

      // ----------------------------------------------
      // 4. Envoyer la demande à Next.js
      // ----------------------------------------------

      const response = await fetch(
        "/api/cardPaiement",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            ...form,

            amount,

            currency: "USD",

            firstname: form.firstname.trim(),
            lastname: form.lastname.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),

            address: form.address.trim(),
            city: form.city.trim(),

            country: form.country
              .trim()
              .toUpperCase(),

            state: form.state.trim(),

            postalCode: form.postalCode.trim(),
          }),
        }
      );

      // ----------------------------------------------
      // 5. Lire la réponse du serveur
      // ----------------------------------------------

      let data: PaymentResponse;

      try {
        data =
          (await response.json()) as PaymentResponse;
      } catch {
        throw new Error(
          "Le serveur a renvoyé une réponse illisible."
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Impossible d'initialiser le paiement."
        );
      }

      // ----------------------------------------------
      // 6. Vérifier le lien de paiement
      // ----------------------------------------------

      if (!data.paymentUrl) {
        throw new Error(
          "Le prestataire n'a pas fourni de lien de paiement."
        );
      }

      let paymentUrl: URL;

      try {
        paymentUrl = new URL(data.paymentUrl);
      } catch {
        throw new Error(
          "Le lien de paiement reçu est invalide."
        );
      }

      if (paymentUrl.protocol !== "https:") {
        throw new Error(
          "Le lien de paiement doit utiliser HTTPS."
        );
      }

      // ----------------------------------------------
      // 7. Rediriger le client vers le checkout
      // ----------------------------------------------

      window.location.assign(paymentUrl.toString());
    } catch (error: unknown) {
      console.error(
        "Erreur paiement Visa :",
        error instanceof Error
          ? error.message
          : "Erreur inconnue"
      );

      setError(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de la préparation du paiement."
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
          {/* Montant */}

          <div className={styles.row}>
            <div>
              <label htmlFor="amount">
                Montant (USD)
              </label>

              <input
                id="amount"
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                min="1"
                step="0.01"
                required
              />
            </div>

            <div>
              <label htmlFor="currency">
                Devise
              </label>

              <input
                id="currency"
                type="text"
                name="currency"
                value="USD"
                readOnly
              />
            </div>
          </div>

          {/* Prénom */}

          <label htmlFor="firstname">
            Prénom
          </label>

          <input
            id="firstname"
            type="text"
            name="firstname"
            value={form.firstname}
            onChange={handleChange}
            autoComplete="given-name"
            required
          />

          {/* Nom */}

          <label htmlFor="lastname">
            Nom
          </label>

          <input
            id="lastname"
            type="text"
            name="lastname"
            value={form.lastname}
            onChange={handleChange}
            autoComplete="family-name"
            required
          />

          {/* Email */}

          <label htmlFor="email">
            Email
          </label>

          <input
            id="email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            required
          />

          {/* Téléphone */}

          <label htmlFor="phone">
            Téléphone
          </label>

          <input
            id="phone"
            type="tel"
            name="phone"
            placeholder="+243..."
            value={form.phone}
            onChange={handleChange}
            autoComplete="tel"
            required
          />

          {/* Adresse */}

          <label htmlFor="address">
            Adresse
          </label>

          <input
            id="address"
            type="text"
            name="address"
            value={form.address}
            onChange={handleChange}
            autoComplete="street-address"
            required
          />

          {/* Ville */}

          <label htmlFor="city">
            Ville
          </label>

          <input
            id="city"
            type="text"
            name="city"
            value={form.city}
            onChange={handleChange}
            autoComplete="address-level2"
            required
          />

          {/* Pays */}

          <label htmlFor="country">
            Pays
          </label>

          <select
            id="country"
            name="country"
            value={form.country}
            onChange={handleChange}
            autoComplete="country"
            required
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

          {/* Province ou État */}

          <label htmlFor="state">
            Province / État
          </label>

          <input
            id="state"
            type="text"
            name="state"
            value={form.state}
            onChange={handleChange}
            autoComplete="address-level1"
          />

          {/* Code postal */}

          <label htmlFor="postalCode">
            Code postal
          </label>

          <input
            id="postalCode"
            type="text"
            name="postalCode"
            value={form.postalCode}
            onChange={handleChange}
            autoComplete="postal-code"
          />

          {/* Erreur */}

          {error && (
            <div
              className={styles.errorVisa}
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Bouton de paiement */}

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