import { useRouter } from "next/router";

export default function VisaAnnule() {
  const router = useRouter();

  const {
    transaction_uuid,
    amount,
    currency,
    reference,
  } = router.query;

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "60px auto",
        padding: 30,
        textAlign: "center",
      }}
    >
      <h1>Paiement annulé</h1>

      <p>
        Vous avez annulé le paiement.
      </p>

      {transaction_uuid && (
        <p>
          Transaction :
          {" "}
          {transaction_uuid}
        </p>
      )}

      {reference && (
        <p>
          Référence :
          {" "}
          {reference}
        </p>
      )}

      {amount && (
        <p>
          Montant :
          {" "}
          {amount} {currency}
        </p>
      )}
    </div>
  );
}