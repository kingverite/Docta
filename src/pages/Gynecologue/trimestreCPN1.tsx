import { useState, useEffect } from "react";
import { useRouter } from "next/router";
//import { auth } from "@/lib/firebase"; // adapte le chemin selon ton projet
import { getClientAuth } from "@/lib/firebase"; // adapte le chemin selon ton projet
import axios from "axios";
import Cookies from "js-cookie";
import styles from "@/styles/Form.module.css";

const TOTAL_STEPS = 5;

const MedicalForm = () => {
  const router = useRouter();

  const [form, setForm] = useState({
    sexe: "", age: "", poids: "", taille: "", temperature: "",
    parlerTeste: "", parlerEco: "", pays: "", ville: "",
    probleme: "", conseil: "", allergies: "", calendrierVaccinal: "",
    antecedent1: "", antecedent2: "", evolutionMaladie: "",PressionArterielle : "",
    examensLaboratoire: "", examensImagerie: "", examensInstrumentaux: "",tuberculose: "",
    diabete: "",hypertension: "",asthme: "",profession: "",fumer: "",alchool: "",interventionChirurgicale: "",
    dateregles: "", parlerVentre: "", parlerNause: "", parlerSaignema: "",saignementVagin: "",ExpliGrossesseNE: "",
    dateregle: "", precisionRisque: "", detailMaladie: "",autreMaladie2: ""
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
      const trimeestre="Premier";

      const finalData = {
        ...form,
        username: username || "inconnu",
        email,
        trimeestre,
        statut: "NON",
        
        ficheNumero: datetimeId,
      };

      await axios.post("/api/apiConsultationCPN", finalData);

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
            <div className={styles["form-group"]}>
              <label>Profession :</label>
              <input type="text" name="profession" value={form.profession} onChange={handleChange} required />
            </div>
           
          </>
        )}

{step === 3 && (
          <>

             <div className={styles["form-group"]}>
              <label>Aviez-vous consulté pour  confirmation de la grossesse ?</label>
              <label><input type="radio" name="teste" value="Oui" onChange={handleChange} required /> Oui</label>
              <label><input type="radio" name="teste" value="Non" onChange={handleChange} required /> Non</label>
            </div>

          <div className={styles["form-group"]}>
              <label>Pouvez-vous nous donner la date, mois, l’année de dernière règle ?</label>
              <input type="date" name="dateregle" value={form.dateregle} onChange={handleChange} required />
            </div>

            <div className={styles["form-group"]}>
              <label>Aviez-vous l’âge de moins de 18 ans ou de 35 ans et plus?</label>
              <label><input type="radio" name="grossesseRisque" value="Oui" onChange={handleChange} required /> Oui</label>
              <label><input type="radio" name="grossesseRisque" value="Non" onChange={handleChange} required /> Non</label>
            </div>

            <div className={styles["form-group"]}>
              <label>Si oui veuillez le preciser</label>
              <input type="text" name="precisionRisque" value={form.precisionRisque}  onChange={handleChange} required />
            </div>
 
            
           
         
          </>
        )}

        {step === 4 && (
          <>
          
          
          
             <div className={styles["form-group"]}>
              <label>Avez-vous faites l’échographie pour confirmer la grossesse ?</label>
              <label><input type="radio" name="ecographie" value="Oui" onChange={handleChange} required /> Oui</label>
              <label><input type="radio" name="ecographie" value="Non" onChange={handleChange} required /> Non</label>
            </div>
            <div className={styles["form-group"]}>
              <label>Si oui veuillez nous en parler :</label>
              <input type="text" name="parlerEco" value={form.parlerEco}  onChange={handleChange} required />
            </div>

            <div className={styles["form-group"]}>
              <label>Avez-vous une hypertension artérielle préexistante avant la grossesse, le diabète, le VIH ou autre maladie ? </label>
              <label><input type="radio" name="maladiePrexistante" value="Oui" onChange={handleChange} required /> Oui</label>
              <label><input type="radio" name="maladiePrexistante" value="Non" onChange={handleChange} required /> Non</label>
            </div>
            <div className={styles["form-group"]}>
              <label>Si Oui veuillez nous donner les détailles :</label>
              <input type="text" name="detailMaladie" value={form.detailMaladie}  onChange={handleChange} required />
            </div>


            
           
          </>
        )}


         {step === 5 && (
          <>
          
          
<div className={styles["form-group"]}>
              <label>Avez-vous d’autres maladies  qui ont été dépistées au cours de votre consultation à l’hôpital ? </label>
              <label><input type="radio" name="autreMaladie" value="Oui" onChange={handleChange} required /> Oui</label>
              <label><input type="radio" name="autreMaladie" value="Non" onChange={handleChange} required /> Non</label>
            </div>

            <div className={styles["form-group"]}>
              <label>Si oui veuillez le préciser :</label>
              <input type="text" name="autreMaladie2" value={form.autreMaladie2}  onChange={handleChange} required />
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

export default MedicalForm;