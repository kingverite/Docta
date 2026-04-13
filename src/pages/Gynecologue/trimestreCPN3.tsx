import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { auth } from "@/lib/firebase"; // adapte le chemin selon ton projet
import axios from "axios";
import Cookies from "js-cookie";
import styles from "@/styles/Form.module.css";

const TOTAL_STEPS = 4;

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
    dateregle: "", precisionRisque: "", detailMaladie: "",autreMaladie2: "",
    interrogatoire2: "",volumeVentre: "",mvmventre: "", tension: "",autresymptome: "", gonflementPieds: "",examens: "",
  });

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  //  Rediriger si l'utilisateur n'est pas connecté
  useEffect(() => {
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
              <label> Aviez-vous une hypertension au cours de la grossesse ? </label>
              <label><input type="radio" name="tension2" value="Oui" onChange={handleChange} required /> Oui</label>
              <label><input type="radio" name="tension2" value="Non" onChange={handleChange} required /> Non</label>
            </div>
            <div className={styles["form-group"]}>
              <label>Si oui pouvez-vous nous en parler  :</label>
              <input type="text" name="tension" value={form.tension}  onChange={handleChange} required />
            </div>

            <div className={styles["form-group"]}>
              <label> Aviez-vous développé du diabète au cours de la grossesse ?  </label>
              <label><input type="radio" name="diabete2" value="Oui" onChange={handleChange} required /> Oui</label>
              <label><input type="radio" name="diabete2" value="Non" onChange={handleChange} required /> Non</label>
            </div>
            <div className={styles["form-group"]}>
              <label>Si oui pouvez-vous nous en parler  :</label>
              <input type="text" name="diabete" value={form.diabete}  onChange={handleChange} required />
            </div>
           
          </>
        )}

{step === 3 && (
          <>

            
             <div className={styles["form-group"]}>
              <label>Pouvez-vous nous dire si vous sentez les mouvements du bébé ?</label>
              <label><input type="radio" name="mvmventr" value="Oui" onChange={handleChange} required /> Oui</label>
              <label><input type="radio" name="mvmventr" value="Non" onChange={handleChange} required /> Non</label>
            </div>
            <div className={styles["form-group"]}>
              <label>Si non pouvez-vous nous expliquer en détail :</label>
              <input type="text" name="mvmventre" value={form.mvmventre}  onChange={handleChange} required />
            </div>

            <div className={styles["form-group"]}>
              <label>Avez-vous des gonflements des pieds qui sont survenus au cours de la grossesse ?</label>
              <label><input type="radio" name="gonflementPied" value="Oui" onChange={handleChange} required /> Oui</label>
              <label><input type="radio" name="gonflementPied" value="Non" onChange={handleChange} required /> Non</label>
            </div>
            <div className={styles["form-group"]}>
              <label>Si Oui pouvez-vous en parler : </label>
              <input type="text" name="gonflementPieds" value={form.gonflementPieds}  onChange={handleChange} required />
            </div>
           
         
          </>
        )}

        {step === 4 && (
          <>
          

             <div className={styles["form-group"]}>
              <label>avez vous de vertige, maux de tête, de palpitation ou /soit de douleur au niveau du bas ventre ou autre à préciser ?  </label>
              <label><input type="radio" name="autresymptome2" value="Oui" onChange={handleChange} required /> Oui</label>
              <label><input type="radio" name="autresymptome2" value="Non" onChange={handleChange} required /> Non</label>
            </div>

            <div className={styles["form-group"]}>
              <label>Si Oui veuillez nous préciser  </label>
              <input type="text" name="autresymptome" value={form.autresymptome}  onChange={handleChange} required />
            </div>

            <div className={styles["form-group"]}>
              <label>Aviez-vous faites une échographie ou un autre examen au cours de  trois derniers mois de la grossesse ? </label>
              <label><input type="radio" name="examen" value="Oui" onChange={handleChange} required /> Oui</label>
              <label><input type="radio" name="examen" value="Non" onChange={handleChange} required /> Non</label>
            </div>

            <div className={styles["form-group"]}>
              <label>Si Oui veuillez nous préciser et expliquer  </label>
              <input type="text" name="examens" value={form.examens}  onChange={handleChange} required />
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