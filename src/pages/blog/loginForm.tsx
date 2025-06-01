import React, { useState } from "react";
import { sendSignInLinkToEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import styles from "@/styles/Form.module.css";

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const actionCodeSettings = {
      url: "https://docta-git-main-kingverites-projects.vercel.app/blog/finishLogin", 
      //url: "http://localhost:3000//blog/finishLogin", // à adapter en production
      handleCodeInApp: true,
    };

    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem("emailForSignIn", email);
      setMessage("Un lien de connexion a été envoyé à votre adresse e-mail.");
    } catch (error: any) {
      console.error("Erreur lors de l'envoi du lien :", error.message);
      setMessage("Erreur lors de l'envoi du lien. Veuillez réessayer.");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.containerL}>
        <h1 className={styles.title}>Connexion par e-mail</h1>
        <form className={styles.form} onSubmit={handleLogin}>
          <input
            type="email"
            name="email"
            placeholder="Adresse e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            required
          />
          <button type="submit" className={styles.button}>
            Envoyer le lien
          </button>
        </form>
        {message && <p className={styles.message}>{message}</p>}
      </div>
    </div>
  );
};

export default LoginForm;