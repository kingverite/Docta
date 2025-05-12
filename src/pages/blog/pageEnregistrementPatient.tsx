import styles from "@/styles/Form.module.css";
import React, { useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";

interface Formstate
{
    statut: string;
    password: string;
    pseudo: string;
   
}

const RegisterForm: React.FC = () => {
  const [form, setForm] = useState<Formstate>({
    statut:"patient",
    password: "",
    pseudo: "",
    
  });
  const [message, setMessage] = useState("");
  const router=useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("formulaire soumis:", form);

    try {
      const response = await axios.post("/api/apiCreationCompte", form);
      console.log("reponse du srveur:", response.data);
      //alert("inscription reussie");
      setMessage("inscription reussie");
      router.push("/blog/loginForm");
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
      <h1 className={styles.title}>Créer un compte</h1>
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
        <p>{"S\'inscrire"}</p>
        </button>
      </form>
      {message && <p className={styles.message}>{message}</p>}
    </div>
    </div>
  );
};


export default RegisterForm;