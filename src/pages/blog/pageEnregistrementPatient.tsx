import React, { useState } from "react";
import styles from "@/styles/Form.module.css";
import { auth, provider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { getFirestore, setDoc, doc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/router";
import Cookies from "js-cookie";

const SignupForm: React.FC = () => {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSignup = async () => {
    if (!username.trim()) {
      setMessage("Veuillez entrer un nom d'utilisateur.");
      return;
    }

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const email = user.email;

      if (!email) {
        setMessage("Erreur : Email introuvable.");
        return;
      }

      // Enregistrement dans Firestore
      const db = getFirestore();
      const userRef = doc(db, "utilisateurs", email);
      await setDoc(userRef, {
        username,
        email,
        statut: "patient",
        createdAt: serverTimestamp(), // Date d’inscription automatique (horodatage serveur)
      });

      // Enregistre dans les cookies
      Cookies.set("username", username, { expires: 7, sameSite: "strict" });
      Cookies.set("statut", "patient", { expires: 7, sameSite: "strict" });

      // Redirection vers la page patient
      router.push("/blog/loginForm");

    } catch (error: any) {
      console.error("Erreur d'inscription :", error.message);
      setMessage("Erreur lors de l'inscription avec Google.");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.containerL}>
        <h1 className={styles.title}>S'inscrire</h1>

        <input
          type="text"
          placeholder="Nom d'utilisateur"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={styles.input}
          required
        />

        <button className={styles.button} onClick={handleSignup}>
          S'inscrire avec Google
        </button>

        {message && <p className={styles.message}>{message}</p>}
      </div>
    </div>
  );
};

export default SignupForm;