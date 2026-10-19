import { useRouter } from "next/router";

export default function VisaResultat() {
  const router = useRouter();

  const {
    status,
    transaction_uuid,
    transaction_id,
    amount,
    currency,
    reference,
    reason_code,
    message,
  } = router.query;

  const success =
    status === "SUCCESS";

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "60px auto",
        padding: 30,
        textAlign: "center",
      }}
    >
      {success ? (
        <>
          <h1>Paiement réussi</h1>

          <p>
            Votre paiement a été
            traité avec succès.
          </p>
        </>
      ) : (
        <>
          <h1>Paiement non abouti</h1>

          <p>
            Le paiement n'a pas été
            confirmé.
          </p>

          {message && (
            <p>{message}</p>
          )}

          {reason_code && (
            <p>
              Code :
              {" "}
              {reason_code}
            </p>
          )}
        </>
      )}

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

      {transaction_id && (
        <p>
          ID :
          {" "}
          {transaction_id}
        </p>
      )}
    </div>
  );
}