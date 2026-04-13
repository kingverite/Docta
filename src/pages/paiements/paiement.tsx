import { useState } from "react";
import axios from "axios";

const methods = [
  { name: "Airtel Money", code: "AM", logo: "/imagee/airtel.jpeg" },
  { name: "Orange Money", code: "OM", logo: "/imagee/orange.jpeg" },
  { name: "M-Pesa", code: "MP", logo: "/imagee/mpesa.jpeg" },
  { name: "Afrimoney", code: "AF", logo: "/imagee/afrimoney.png" },
];

export default function Paiement() {
  const [selected, setSelected] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!selected) return alert("Choisis un moyen");

    setLoading(true);

    try {
      await axios.post("/api/apiPayment", {
        phone,
        amount,
        telecom: selected,
      });

      alert("Paiement lancé !");
    } catch {
      alert("Erreur");
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Paiement</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {methods.map((m) => (
          <div
            key={m.code}
            onClick={() => setSelected(m.code)}
            style={{
              border: "1px solid #ccc",
              padding: 10,
              cursor: "pointer",
              background: selected === m.code ? "#dbeafe" : "white",
            }}
          >
            <img src={m.logo} style={{ height: 40 }} />
            <p>{m.name}</p>
          </div>
        ))}
      </div>

      <input
        placeholder="Téléphone"
        onChange={(e) => setPhone(e.target.value)}
      />
      <input
        placeholder="Montant"
        onChange={(e) => setAmount(e.target.value)}
      />

      <button onClick={handlePayment}>
        {loading ? "..." : "Payer"}
      </button>
    </div>
  );
}