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
    nbrGrosses: "", nbrAccouchement: "", nbrAvortement: "", nbrEnfantVivant: "", nbrEnfantDecede: "",cesariennes: "", 
    intervationGyn:"",grossesseTerme:"", douleurHanche:"", piedVolumeX:"", bilan:"",
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
              <label>Tension artérielle  :</label>
              <input type="number" name="PressionArterielle" value={form.PressionArterielle} onChange={handleChange} placeholder="mm Hg" required />
              
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
              <label>preciser le nombre de grossesses que vous aviez déja portés :</label>
              <input type="number" name="nbrGrosses" value={form.nbrGrosses} onChange={handleChange} required />
            </div>
        <div className={styles["form-group"]}>
              <label>preciser le nombre d’accouchements:</label>
              <input type="number" name="nbrAccouchement" value={form.nbrAccouchement} onChange={handleChange} required />
            </div>
            <div className={styles["form-group"]}>
              <label>preciser le nombre d’avortements:</label>
              <input type="number" name="nbrAvortement" value={form.nbrAvortement} onChange={handleChange} required />
            </div>

             <div className={styles["form-group"]}>
              <label>preciser le nombre d’enfants vivants:</label>
              <input type="number" name="nbrEnfantVivant" value={form.nbrEnfantVivant} onChange={handleChange} required />
            </div>
            
             <div className={styles["form-group"]}>
              <label>preciser le nombre d’enfants Décedés:</label>
              <input type="number" name="nbrEnfantDecede" value={form.nbrEnfantDecede} onChange={handleChange} required />
            </div>
          </>
        )}

{step === 3 && (
          <>
           <div className={styles["form-group"]}>
              <label>Aviez-vous consulté un médecin ou personnel soignant pour avoir le pronostic de votre accouchement ?  </label>
              <label><input type="radio" name="conseilX" value="Oui" onChange={handleChange} required /> Oui</label>
              <label><input type="radio" name="conseilX" value="Non" onChange={handleChange} required /> Non</label>
            </div>
             <div className={styles["form-group"]}>
              <label> Si oui pouvez-vous  nous  en parler : :</label>
              <input type="text" name="conseil" value={form.conseil}  onChange={handleChange} required />
            </div>

            <div className={styles["form-group"]}>
              <label>Aviez-vous  développé hypertension artériel au cours de la grossesse ?  </label>
              <label><input type="radio" name="hypertensionx" value="Oui" onChange={handleChange} required /> Oui</label>
              <label><input type="radio" name="hypertensionx" value="Non" onChange={handleChange} required /> Non</label>
            </div>
             <div className={styles["form-group"]}>
              <label> Si Oui  quel a été le traitement ?  </label>
              <input type="text" name="hypertension" value={form.hypertension}  onChange={handleChange} required />
            </div>
             <div className={styles["form-group"]}>
              <label>Aviez-vous développé le diabète au cours de la grossesse ?  </label>
              <label><input type="radio" name="diabeteX" value="Oui" onChange={handleChange} required /> Oui</label>
              <label><input type="radio" name="diabetex" value="Non" onChange={handleChange} required /> Non</label>
            </div>
             <div className={styles["form-group"]}>
              <label> Si oui quel  a été  le traitement ? </label>
              <input type="text" name="diabete" value={form.diabete}  onChange={handleChange} required />
            </div>
         
          </>
        )}

        {step === 4 && (
          <>
          
           <div className={styles["form-group"]}>
              <label>Aviez-vous subi  une ou plus de deux césariennes dans le passé ?   </label>
              <label><input type="radio" name="cesariennesX" value="Oui" onChange={handleChange} required /> Oui</label>
              <label><input type="radio" name="cesariennesX" value="Non" onChange={handleChange} required /> Non</label>
            </div>
             <div className={styles["form-group"]}>
              <label> Si oui : vous pouvez indiquer le nombre, les causes et si possible dériver l’évènement : </label>
              <textarea name="cesariennes" value={form.cesariennes}  onChange={handleChange} required />
            </div>
           
           
            <div className={styles["form-group"]}>
              <label>Aviez-vous subit une autre intervention gynécologique, chirurgicale en dehors d’une césarienne ? </label>
              <label><input type="radio" name="intervationGynX" value="Oui" onChange={handleChange} required /> Oui</label>
              <label><input type="radio" name="intervationGynX" value="Non" onChange={handleChange} required /> Non</label>
            </div>
            <div className={styles["form-group"]}>
              <label> Si oui pouvez-vous nous décrire cela avec précision ?  </label>
              <textarea  name="intervationGyn" value={form.intervationGyn}  onChange={handleChange} required />
            </div>
           
          </>
        )}

 {step === 5 && (
          <>
            
               <div className={styles["form-group"]}>
              <label>Pensez-vous que votre grossesse est à terme soit 38 semaines d’absence de vos règles ou soit au dela de 40 semaines d’absences des règles ?</label>
              <label><input type="radio" name="grossesseTermeX" value="Oui" onChange={handleChange} required /> Oui</label>
              <label><input type="radio" name="grossesseTermeX" value="Non" onChange={handleChange} required /> Non</label>
            </div>
            <div className={styles["form-group"]}>
              <label> Si  oui vous pouvez préciser  : </label>
              <input type="text" name="grossesseTerme" value={form.grossesseTerme}  onChange={handleChange} required />
            </div>

             <div className={styles["form-group"]}>
              <label>Pouvez-vous nous dire si vous avez de douleur au niveau de la hanche (tout en précisant le début en termes de temps, des descriptions plus détailles)? </label>
              <label><input type="radio" name="douleurHancheX" value="Oui" onChange={handleChange} required /> Oui</label>
              <label><input type="radio" name="douleurHancheX" value="Non" onChange={handleChange} required /> Non</label>
            </div>
            <div className={styles["form-group"]}>
              <label>Si oui, vous le-vous bien nous en parlez : </label>
              <textarea name="douleurHanche" value={form.douleurHanche}  onChange={handleChange} required />
            </div>
            
          </>
        )}
        {step === 6 && (
          <>
             
            <div className={styles["form-group"]}>
              <label>Pouvez-vous nous dire si vous avez des saignements qui s’accompagnent des douleurs de la hanche (tout en précisant le début, l’estimation de la quantité, la couleur du sang rouge vif, noirâtre ? </label>
              <label><input type="radio" name="parlerSaignemax" value="Oui" onChange={handleChange} required /> Oui</label>
              <label><input type="radio" name="parlerSaignemax" value="Non" onChange={handleChange} required /> Non</label>
            </div>
             <div className={styles["form-group"]}>
              <label> Si oui veuillez nous en parler : </label>
              <input type="text" name="parlerSaignema" value={form.parlerSaignema}  onChange={handleChange} required />
            </div>
             <div className={styles["form-group"]}>
              <label> Avez-vous de pieds qui ont augmenté de volume au cours de la grossesse ?  </label>
              <label><input type="radio" name="piedVolumeX" value="Oui" onChange={handleChange} required /> Oui</label>
              <label><input type="radio" name="piedVolumeX" value="Non" onChange={handleChange} required /> Non</label>
            </div>
             <div className={styles["form-group"]}>
              <label> Si oui veuillez nous en parler : : </label>
              <input type="text" name="piedVolumeX" value={form.piedVolumeX}  onChange={handleChange} required />
            </div>
          </>
        )}

        {step === 7 && (
          <>
           <div className={styles["form-group"]}>
              <label>  Poser la question si vous avez une préocupation concernant le dépassement du jour d’accouchement ?</label>
              <input type="text" name="piedVolumeX" value={form.piedVolumeX}  onChange={handleChange} required />
            </div>

             <div className={styles["form-group"]}>
              <label> Aviez-vous fait un bilan para clinique au cours de la grossesse ?</label>
              <label><input type="radio" name="bilanx" value="Oui" onChange={handleChange} required /> Oui</label>
              <label><input type="radio" name="bilanx" value="Non" onChange={handleChange} required /> Non</label>
            </div>
             <div className={styles["form-group"]}>
              <label> Si Oui pouvez- vous nous en parlez  : </label>
              <input type="text" name="bilan" value={form.bilan}  onChange={handleChange} required />
            </div> 
            <div className={styles["form-group"]}>
              <label> Aviez-vous fait un examen d’imagerie médicale (par exemple échographie,…) afin de donner le pronostic de l’issue de la grossesse ?</label>
              <label><input type="radio" name="examensImageriex" value="Oui" onChange={handleChange} required /> Oui</label>
              <label><input type="radio" name="examensImageriex" value="Non" onChange={handleChange} required /> Non</label>
            </div>
             <div className={styles["form-group"]}>
              <label> Si oui veuillez nous en parler brièvement : </label>
              <input type="text" name="examensImagerie" value={form.examensImagerie}  onChange={handleChange} required />
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