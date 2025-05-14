import styles from "@/styles/Form.module.css";
import React, { useState } from "react";
import  Cookies  from "js-cookie";
import { useRouter } from "next/router";
import axios from "axios";
//import type { AxiosError } from "axios";

const LoginForm: React.FC = () => {
  const router=useRouter();
  const [form, setForm] = useState({
    pseudo: "",
    password: "",
  });
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      
      const response = await axios.post<{username:string; statut:string}>("/api/apiLoginForm", form);
      console.log("donnees :",response.data);
      const { username, statut } = response.data;
      Cookies.set("username", username, { expires: 7, sameSite: "strict" });
      Cookies.set("statut", statut, { expires: 7, sameSite: "strict" });

      if (statut === "patient") {
        router.push("/blog/pageAcceuil");
      } else if (statut === "medecin") {
        router.push("/blog/Docta");
      } else {
        alert("Accès refusé : statut inconnu !");
      }

      //setMessage(response.data.message);
    } catch (error: unknown) {
      if(error instanceof Error)
        {
      console.log("erreur lors de l'inscription:", error.message);
      //alert(error.response?.data?.error || "Erreur inattendue ou choisir un pseudo qui n'est pas encore utilise")
      setMessage( "Erreur lors de l'inscription.");
    }
      else
    {
      console.log("erreur inconnu");
    }
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.containerL}>
        <h1 className={styles.title}>Se connecter</h1>
        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            type="text"
            name="pseudo"
            placeholder="Pseudo"
            value={form.pseudo}
            onChange={handleChange}
            className={styles.input}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Mot de passe"
            value={form.password}
            onChange={handleChange}
            className={styles.input}
            required
          />
          <button type="submit" className={styles.button}>
            Connexion
          </button>
        </form>
        {message && <p className={styles.message}>{message}</p>}
      </div>
    </div>
  );
};



// Ajoutez des effets visuels (hover et focus)
Object.assign(styles.input, {
  ':focus': {
    borderColor: "#007BFF",
  },
});
Object.assign(styles.button, {
  ':hover': {
    backgroundColor: "#0056b3",
  },
});

export default LoginForm;