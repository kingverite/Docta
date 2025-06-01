import styles from "@/styles/Form.module.css";
import React, { useState } from "react";
import { useRouter } from "next/router";
import { auth, provider } from "@/lib/firebase"; // `provider` = new GoogleAuthProvider()
import { signInWithPopup } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

const RegisterForm: React.FC = () => {
  const [form, setForm] = useState({
    username: "",
    statut: "",
  });
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleGoogleSignup = async () => {
    if (!form.username || !form.statut) {
      setMessage("Veuillez remplir tous les champs avant de vous inscrire avec Google.");
      return;
    }

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const db = getFirestore();
      await setDoc(doc(db, "utilisateurs", user.email!), {
        username: form.username,
        statut: form.statut,
        email: user.email,
        createdAt: serverTimestamp(),
      });

      router.push("/blog/loginForm");
    } catch (error: any) {
      console.error("Erreur d'inscription avec Google:", error.message);
      setMessage("Erreur lors de l'inscription.");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.containerL}>
        <h1 className={styles.title}>Créer un compte</h1>
        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <input
            type="text"
            name="username"
            placeholder="Nom d'utilisateur"
            value={form.username}
            onChange={handleChange}
            className={styles.input}
            required
          />

          <select
            name="statut"
            value={form.statut}
            onChange={handleChange}
            className={styles.input}
            required
          >
            <option value="">Choisir une spécialité</option>
            <option value="pediatre">Pédiatre</option>
            <option value="Gynecologue">Gynécologue</option>
            <option value="Chirurgien">Chirurgien</option>
            <option value="Ophtalmologue">Ophtalmologue</option>
            <option value="ORL">ORL</option>
            <option value="Dermologue">Dermologue</option>
            <option value="Psychiatre">Psychiatre</option>
            <option value="Neurologue">Neurologue</option>
          </select>

          <button type="button" onClick={handleGoogleSignup} className={styles.button}>
            S’inscrire avec Google
          </button>
        </form>

        {message && <p className={styles.message}>{message}</p>}
      </div>
    </div>
  );
};

export default RegisterForm;