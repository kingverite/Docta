import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth } from "@/lib/firebase";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import Cookies from "js-cookie";
import styles from "@/styles/Form.module.css";

const FinishLogin = () => {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const completeLogin = async () => {
      try {
        if (typeof window === "undefined") return;
        const email = window.localStorage.getItem("emailForSignIn");

        if (!email || !isSignInWithEmailLink(auth, window.location.href)) {
          setMessage("Lien invalide ou expiré.");
          return;
        }

        const result = await signInWithEmailLink(auth, email, window.location.href);
        window.localStorage.removeItem("emailForSignIn");

        const db = getFirestore();
        const userRef = doc(db, "utilisateurs", email);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          const statut = userData.statut || "patient";
          const username = userData.username || "";

          Cookies.set("username", username, { expires: 7 });
          Cookies.set("statut", statut, { expires: 7 });

          if (statut === "patient") {
            router.push("/blog/pageAcceuil");
          } else {
            router.push("/blog/Docta");
          }
        } else {
          setNotFound(true); // utilisateur non trouvé
        }
      } catch (error: any) {
        console.error("Erreur de connexion :", error.message);
        setMessage("Erreur de connexion.");
      }
    };

    completeLogin();
  }, []);

  const handleRedirectToSignup = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/blog/pageEnregistrementPatient");
  };

  if (notFound) {
    return (
      <div className={styles.page}>
        <div className={styles.containerL}>
          <h1 className={styles.title}>Ce compte n'existe pas</h1>
          <form className={styles.form} onSubmit={handleRedirectToSignup}>
            <button type="submit" className={styles.button}>
              Cliquez pour créer un compte
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Connexion en cours...</h2>
      <p>{message}</p>
    </div>
  );
};

export default FinishLogin;