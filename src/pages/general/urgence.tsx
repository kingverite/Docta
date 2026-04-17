import { useState, useEffect } from "react";
import { useRouter } from "next/router";
//import { auth } from "@/lib/firebase"; // adapte le chemin selon ton projet
import { getClientAuth } from "@/lib/firebase"; // adapte le chemin selon ton projet
import axios from "axios";
import Cookies from "js-cookie";
import styles from "@/styles/Form.module.css";

const TOTAL_STEPS = 4;

const MedicalFormU = () => {
  const router = useRouter();

  const [form, setForm] = useState({
    sexe: "", age: "", poids: "", taille: "", temperature: "",
    frequenceCardiaque: "", saturationOxygene: "", pays: "", ville: "",
    probleme: "", evolutionMaladie: "",PressionArterielle : "",
  });

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  

  //  Rediriger si l'utilisateur n'est pas connecté
  useEffect(() => {
    const auth = getClientAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/blog/loginForm");
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Charger depuis localStorage
  useEffect(() => {
    const savedForm = localStorage.getItem("formData");
    const savedStep = localStorage.getItem("formStep");
    if (savedForm) setForm(JSON.parse(savedForm));
    if (savedStep) setStep(parseInt(savedStep));
  }, []);

  // Sauvegarde automatique
  useEffect(() => {
    localStorage.setItem("formData", JSON.stringify(form));
    localStorage.setItem("formStep", step.toString());
  }, [form, step]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const nextStep = () => step < TOTAL_STEPS && setStep(step + 1);
  const prevStep = () => step > 1 && setStep(step - 1);

  const handleSave = async () => {
    setLoading(true);
    try {
      const auth = getClientAuth();
      const username = Cookies.get("username");
      const datetimeId = new Date().toISOString();
      const email = auth.currentUser?.email || "email inconnu";

      const finalData = {
        ...form,
        username: username || "inconnu",
        email,
        statut: "NON",
        specialite: "Urgence",
        ficheNumero: datetimeId,
      };

      await axios.post("/api/apiConsultation", finalData);

      setSaved(true);
      localStorage.removeItem("formData");
      localStorage.removeItem("formStep");

      //  Redirection après enregistrement
      router.push("/blog/loginForm");
    } catch (error) {
      console.error("Erreur de sauvegarde", error);
    }
    setLoading(false);
  }

  return (
    
    <div className={styles["form-container"]}>
      <h2>Formulaire Médical</h2>
      <form>
        {step === 1 && (
          <>
            <div className={styles["form-group"]}>
              <label>Sexe :</label>
              <label><input type="radio" name="sexe" value="Masculin" onChange={handleChange} required /> Masculin</label>
              <label><input type="radio" name="sexe" value="Féminin" onChange={handleChange} required /> Féminin</label>
            </div>
            <div className={styles["form-group"]}>
              <label>Âge :</label>
              <input type="number" name="age" value={form.age} onChange={handleChange} required />
            </div>
            <div className={styles["form-group"]}>
              <label>Poids(Kg) :</label>
              <input type="number" name="poids" value={form.poids} onChange={handleChange} required />
            </div>
            <div className={styles["form-group"]}>
              <label>Taille(Cm) :</label>
              <input type="number" name="taille" value={form.taille} onChange={handleChange} required />
            </div>
          <div className={styles["form-group"]}>
              <label>Temperature(°C) :</label>
              <input type="number" name="temperature" value={form.temperature} onChange={handleChange} required />
            </div>
            
          </>
        )}

        {step === 2 && (
          <>
         <div className={styles["form-group"]}>
              <label>Pays :</label>
              <input type="text" name="pays" value={form.pays} onChange={handleChange} required />
            </div>
            <div className={styles["form-group"]}>
              <label>Ville :</label>
              <input type="text" name="ville" value={form.ville} onChange={handleChange} required />
            </div>
            
          </>
        )}

{step === 3 && (
          <>
          
            <div className={styles["form-group"]}>
              <label>Fréquence cardiaque(BPM) :</label>
              <input type="number" name="frequenceCardiaque" value={form.frequenceCardiaque} placeholder="Facultatif" onChange={handleChange} required />
            </div>
            <div className={styles["form-group"]}>
              <label>Saturation en oxygène(%) :</label>
              <input type="number" name="saturationOxygene" value={form.saturationOxygene} placeholder="Facultatif" onChange={handleChange} required />
            </div>
            <div className={styles["form-group"]}>
              <label>Pression Arterielle :</label>
              <input type="text" name="PressionArterielle" value={form.PressionArterielle} onChange={handleChange} required />
            </div>

            
          </>
        )}

        {step === 4 && (
          <>
          
            <div className={styles["form-group"]}>
              <label>Quel est le grand problème ?</label>
              <textarea name="probleme" value={form.probleme} onChange={handleChange} required />
            </div>
            <div className={styles["form-group"]}>
              <label>comment votre maladie à évoluer ?        :</label>
              <textarea name="evolutionMaladie" value={form.evolutionMaladie} onChange={handleChange} required />
            </div>
           
          </>
        )}

 

        <div className={styles["form-buttons"]}>
          {step > 1 && <button type="button" onClick={prevStep}>Précédent</button>}
          {step < TOTAL_STEPS ? (
            <button type="button" onClick={nextStep}>Suivant</button>
          ) : (
            <button type="button" onClick={handleSave}>
              {loading ? "Enregistrement..." : "Enregistrer"}
            </button>
          )}
        </div>
      </form>

      {saved && <p className={styles["success-message"]}>Formulaire enregistré avec succès !</p>}
    </div>
    
  );
};

export default MedicalFormU;