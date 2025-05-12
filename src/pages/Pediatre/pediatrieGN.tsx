import { useState, useEffect } from "react";
import axios from "axios";
import styles from "@/styles/Form.module.css";

const TOTAL_STEPS = 6;
const MedicalForm =  () => {
  const [form, setForm] = useState({
    name: "",
    sexe: "",
    age: "",
    poids: "",
    taille: "",
    temperature: "",
    frequenceCardiaque: "",
    saturationOxygene: "",
    pays: "",
    ville: "",
    probleme: "",
    conseil: "",
    allergies: "",
    calendrierVaccinal: "",
    antecedent1: "",
    antecedent2: "",
    evolutionMaladie: "",
    examensLaboratoire: "",
    examensImagerie: "",
    examensInstrumentaux: "",
  });

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Charger depuis localStorage
  useEffect(() => {
    const savedForm = localStorage.getItem("formData");
    const savedStep = localStorage.getItem("formStep");
    if (savedForm) setForm(JSON.parse(savedForm));
    if (savedStep) setStep(parseInt(savedStep));
  }, []);

  // Sauvegarde auto
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
      await axios.post("/api/apiPediatrieGN", form);
      setSaved(true);
      localStorage.removeItem("formData");
      localStorage.removeItem("formStep");
    } catch (error) {
      console.error("Erreur de sauvegarde", error);
    }
    setLoading(false);
  };

  return (
    
    <div className={styles["form-container"]}>
      <h2>Formulaire Médical</h2>
      <form>
        {step === 1 && (
          <>
            <div className={styles["form-group"]}>
              <label>Nom et Prénom :</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} required />
            </div>
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
            
            
          </>
        )}

        {step === 2 && (
          <>
          <div className={styles["form-group"]}>
              <label>Taille(Cm) :</label>
              <input type="number" name="taille" value={form.taille} onChange={handleChange} required />
            </div>
          <div className={styles["form-group"]}>
              <label>Temperature(°C) :</label>
              <input type="number" name="temperature" value={form.temperature} onChange={handleChange} required />
            </div>
            <div className={styles["form-group"]}>
              <label>Fréquence cardiaque(BPM) :</label>
              <input type="number" name="frequenceCardiaque" value={form.frequenceCardiaque} placeholder="Facultatif" onChange={handleChange} required />
            </div>
            <div className={styles["form-group"]}>
              <label>Saturation en oxygène(%) :</label>
              <input type="number" name="saturationOxygene" value={form.saturationOxygene} placeholder="Facultatif" onChange={handleChange} required />
            </div>
          </>
        )}

{step === 3 && (
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

        {step === 4 && (
          <>
            <div className={styles["form-group"]}>
              <label>Dictez-nous quels sont les problèmes auxquels vous voulais avoir conseil ?  :</label>
              <textarea name="probleme" value={form.probleme} onChange={handleChange} required />
            </div>
            <div className={styles["form-group"]}>
              <label>Avez-vous déjà consulté votre médecin conseil ?  :</label>
              <label><input type="radio" name="conseil" value="Oui" onChange={handleChange} required /> Oui</label>
              <label><input type="radio" name="conseil" value="Non" onChange={handleChange} required /> Non</label>
            </div>
            <div className={styles["form-group"]}>
              <label>Si vous aviez eu des maladies suivantes dans les passées, quels sont les médicaments, aliments et autres auxquels vous avez des allergiques ?  </label>
              <textarea name="allergies" value={form.allergies} onChange={handleChange} required />
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <div className={styles["form-group"]}>
              <label>Votre calendrier vaccinal est-il à jour ?</label>
              <label><input type="radio" name="calendrierVaccinal" value="Oui" onChange={handleChange} required /> Oui</label>
              <label><input type="radio" name="calendrierVaccinal" value="Non" onChange={handleChange} required /> Non</label>
            </div>
            <div className={styles["form-group"]}>
              <label>Y a-t-il des cas de maladie similaires dans votre famille restreinte?</label>
              <label><input type="radio" name="antecedent1" value="Oui" onChange={handleChange} required /> Oui</label>
              <label><input type="radio" name="antecedent1" value="Non" onChange={handleChange} required /> Non</label>
            </div>
            <div className={styles["form-group"]}>
              <label>Y a-t-il des cas de maladie similaires dans votre famille élargie ??</label>
              <label><input type="radio" name="antecedent2" value="Oui" onChange={handleChange} required /> Oui</label>
              <label><input type="radio" name="antecedent2" value="Non" onChange={handleChange} required /> Non</label>
            </div>
            
          </>
        )}

        {step === 6 && (
          <>
               <div className={styles["form-group"]}>
      
      <p>{"Décrivez l\'évolution de la maladie :"}</p>
      <textarea
        name="evolutionMaladie"
        value={form.evolutionMaladie}
        onChange={handleChange}
        placeholder="Expliquez comment la maladie a évolué et depuis combien de temps vous êtes malade."
        required
      />
    </div>

    <div className={styles["form-group"]}>
      <label>Examens médicaux passés :</label>
      <textarea
        name="examensLaboratoire"
        value={form.examensLaboratoire}
        onChange={handleChange}
        placeholder="Indiquez les examens de laboratoire effectués (prise de sang, analyses, etc.)."
      />
      <textarea
        name="examensImagerie"
        value={form.examensImagerie}
        onChange={handleChange}
        placeholder="Indiquez les examens d'imagerie médicale réalisés (radiographie, scanner, IRM, etc.)."
      />
      <textarea
        name="examensInstrumentaux"
        value={form.examensInstrumentaux}
        onChange={handleChange}
        placeholder="Indiquez les explorations instrumentales effectuées (ECG, endoscopie, etc.)."
      />
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