import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { auth } from "@/lib/firebase"; // adapte le chemin selon ton projet
import axios from "axios";
import Cookies from "js-cookie";
import styles from "@/styles/Form.module.css";

const TOTAL_STEPS = 7;

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

      await axios.post("/api/apiConsultationGynecologique", finalData);

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
            <div className={styles["form-group"]}>
              <label>Profession :</label>
              <input type="text" name="profession" value={form.profession} onChange={handleChange} required />
            </div>
            <div className={styles["form-group"]}>
              <label>Quel est la date de vos dernières règles :</label>
               <input type="date" name="dateregles" value={form.dateregles} onChange={handleChange} required />
            </div>
          </>
        )}

{step === 3 && (
          <>
            <div className={styles["form-group"]}>
              <label>Avez-vous faites un retard de vos règles ?</label>
              <label><input type="radio" name="regles" value="Oui" onChange={handleChange} required /> Oui</label>
              <label><input type="radio" name="regles" value="Non" onChange={handleChange} required /> Non</label>
            </div>

              <div className={styles["form-group"]}>
              <label>Avez-vous faites le test de grossesse ?</label>
              <label><input type="radio" name="teste" value="Oui" onChange={handleChange} required /> Oui</label>
              <label><input type="radio" name="teste" value="Non" onChange={handleChange} required /> Non</label>
            </div>

            <div className={styles["form-group"]}>
              <label>Si oui veuillez nous en parler :</label>
              <input type="text" name="parlerTeste" value={form.parlerTeste}  onChange={handleChange} required />
            </div>

            <div className={styles["form-group"]}>
              <label>Avez-vous faites l’échographie pour confirmer la grossesse ?  ?</label>
              <label><input type="radio" name="ecographie" value="Oui" onChange={handleChange} required /> Oui</label>
              <label><input type="radio" name="ecographie" value="Non" onChange={handleChange} required /> Non</label>
            </div>
            <div className={styles["form-group"]}>
              <label>Si oui veuillez nous en parler :</label>
              <input type="text" name="parlerEco" value={form.parlerEco}  onChange={handleChange} required />
            </div>
            

         
          </>
        )}

        {step === 4 && (
          <>
          
            <div className={styles["form-group"]}>
              <label>Avez-vous des signes suivantes : nausée, vomissent, douleur au niveau de la tété, palpitation au autre à préciser ?</label>
              <label><input type="radio" name="nause" value="Oui" onChange={handleChange} required /> Oui</label>
              <label><input type="radio" name="nause" value="Non" onChange={handleChange} required /> Non</label>
            </div>

            <div className={styles["form-group"]}>
              <label>Si oui faite une description  et prcisez autre symptome non cité ci-haut s'il y en a:</label>
              <textarea name="parlerNause" value={form.parlerNause}  onChange={handleChange} required />
            </div>

            <div className={styles["form-group"]}>
              <label>Avez-vous des douleurs dans les bas ventres ? </label>
              <label><input type="radio" name="ventre" value="Oui" onChange={handleChange} required /> Oui</label>
              <label><input type="radio" name="ventre" value="Non" onChange={handleChange} required /> Non</label>
            </div>

            <div className={styles["form-group"]}>
              <label>Si oui vous pouvez décrire comment vous ressentez la douleur </label>
              <input type="text" name="parlerVentre" value={form.parlerVentre}  onChange={handleChange} required />
            </div>
            
           
          </>
        )}

 {step === 5 && (
          <>
            <div className={styles["form-group"]}>
              <label>Est-ce que vous avez constaté les saignements au niveau de votre organe génital externe  ?  :</label>
              <label><input type="radio" name="saignement" value="Oui" onChange={handleChange} required /> Oui</label>
              <label><input type="radio" name="saignement" value="Non" onChange={handleChange} required /> Non</label>
            </div>
           
            <div className={styles["form-group"]}>
              <label>Si oui, Pouvez- vous décrirez en se réfèrant sur les éléments suivants  (Le début des saignements au niveau du vagin, la couleur du sang qui peut être rouge vif, plus au moins noir et autres à préciser, la quantité qui peut être de petite, moyenne abondance ou soit autre manifestation à préciser) </label>
               <textarea  name="parlerSaignema" value={form.parlerSaignema}  onChange={handleChange} required />
            </div>
            <div className={styles["form-group"]}>
              <label>Le saignement au niveau du vagin est-elle accompagné des produits de conception ?</label>
              <label><input type="radio" name="saignementV" value="Oui" onChange={handleChange} required /> Oui</label>
              <label><input type="radio" name="saignementV" value="Non" onChange={handleChange} required /> Non</label>
            </div>
            <div className={styles["form-group"]}>
              <label> Si oui faites une petite description : </label>
              <input type="text" name="saignementVagin" value={form.saignementVagin}  onChange={handleChange} required />
            </div>

            
          </>
        )}
        {step === 6 && (
          <>
             <div className={styles["form-group"]}>
              <label>Est-ce qu’il existe dans le passé un ou plusieurs grossesses qui n’ont pas évoluées ?</label>
              <label><input type="radio" name="grossesseNE" value="Oui" onChange={handleChange} required /> Oui</label>
              <label><input type="radio" name="grossesseNE" value="Non" onChange={handleChange} required /> Non</label>
            </div>
            <div className={styles["form-group"]}>
              <label> Si oui vous prouvez nous donnez une breuve explication de la cause dont les personnelles soignants vous avaient expliqué : </label>
              <input type="text" name="ExpliGrossesseNE" value={form.ExpliGrossesseNE}  onChange={handleChange} required />
            </div>
            <div className={styles["form-group"]}>
              <label>Aviez-vous l’hypertension artérielle ? </label>
              <label><input type="radio" name="hypertensionx" value="Oui" onChange={handleChange} required /> Oui</label>
              <label><input type="radio" name="hypertensionx" value="Non" onChange={handleChange} required /> Non</label>
            </div>
             <div className={styles["form-group"]}>
              <label> Si oui vous pouvez faire une brève description et precisez si c'est avant ou après la gossesse : </label>
              <input type="text" name="hypertension" value={form.hypertension}  onChange={handleChange} required />
            </div>
            
          </>
        )}

        {step === 7 && (
          <>
           <div className={styles["form-group"]}>
              <label>Aviez-vous du diabète au cours de la dernière grossesse  ? </label>
              <label><input type="radio" name="diabeteX" value="Oui" onChange={handleChange} required /> Oui</label>
              <label><input type="radio" name="diabetex" value="Non" onChange={handleChange} required /> Non</label>
            </div>
             <div className={styles["form-group"]}>
              <label> Si oui vous pouvez faire une brève description et precisez si c'est avant ou après la gossesse : </label>
              <input type="text" name="diabete" value={form.diabete}  onChange={handleChange} required />
            </div>

            <div className={styles["form-group"]}>
              <label>Aviez déjà contacté les personnels soignant pour les conseils ?  </label>
              <label><input type="radio" name="conseilX" value="Oui" onChange={handleChange} required /> Oui</label>
              <label><input type="radio" name="conseilX" value="Non" onChange={handleChange} required /> Non</label>
            </div>
             <div className={styles["form-group"]}>
              <label> Si oui  décrivez le type de conseil qu’il vous a donné :</label>
              <input type="text" name="conseil" value={form.conseil}  onChange={handleChange} required />
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