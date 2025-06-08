import styles from "@/styles/Form.module.css";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { FaSearch } from "react-icons/fa";

interface Consultation {
  username: string;
  ficheNumero: string;
  id: string;
  age: number;
  specialite: string;
  statut: string;
  statutCollection: string;
  allergies: string;
  antecedant1: string;
  antecedant2: string;
  calendrierVaccinal: string;
  conseil: string;
  evolutionMaladie: string;
  examensImagerie: string;
  examensInstrumentaux: string;
  examensLaboratoire: string;
  frequenceCardiaque: number;
  pays: string;
  poids: number;
  probleme: string;
  saturationOxygene: number;
  sexe: string;
  taille: number;
  temperature: number;
  ville: string;
}

const fieldLabels: Record<string, string> = {
  poids: "Poids",
  taille: "Taille",
  temperature: "Température",
  examensLaboratoire: "Examens Laboratoire",
  saturationOxygene: "Saturation en oxygène",
  frequenceCardiaque: "Frequence cardiaque",
  examensInstrumentaux: "Examens instrumentaux",
  examensImagerie: "Examens imagerie",
  evolutionMaladie: "Evolution de la maladie",
  calendrierVaccinal: "calendrier Vaccinal",
  antecedent1: "antécédant famille restreinte",
  antecedent2: "antécédant famille elargie",
  specialite: "specialité",
  probleme: "problème",
  age: "âge ",
  
};

interface Suivi {
  date: string;
  resultat1: string;
  resultat2 : string;
  commentaire: string;
}

interface Reponse {
  reponse: string;
  ordonnance: string;  // ici url de l'image
  date: string;
  suivi?: Suivi[];
}

export default function ConsultationsList() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [reponse, setReponse] = useState("");
  const [ordonnanceFile, setOrdonnanceFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [historique, setHistorique] = useState<Reponse[]>([]);
  const [modifIndex, setModifIndex] = useState<number | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [rechercheFicheNumero, setRechercheFicheNumero] = useState<string>("");

  const [imageUrl, setImageUrl] = useState<string | null>(null);
const [isModalOpen, setIsModalOpen] = useState(false);

   const fetchConsultations = async () => {
    if (!rechercheFicheNumero) {
      alert("Veuillez entrer le ficheNumero et le statut");
      return;
    }

    try {
      const response = await axios.get<Consultation[]>("/api/apiSearchFiche2", {
        params: {
          ficheNumero: rechercheFicheNumero,
          
        },
      });
      setConsultations(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement des consultations :", error);
    }
  };

  useEffect(() => {
    const username = Cookies.get("username");
    if (!username) {
      console.error("Nom d'utilisateur manquant.");
      return;
    }

    axios
      .get<Consultation[]>("/api/apiResutats", { params: { username } })
      .then((response) => setConsultations(response.data))
      .catch((error) => console.error("Erreur récupération consultations", error));
  }, []);

  const fetchHistorique = async (ficheNumero: string, statut: string) => {
    try {
      const res = await axios.get<Reponse[]>("/api/apiHistorique", {
        params: { ficheNumero, statut },
      });
      setHistorique(res.data);
      setModifIndex(null);
      setReponse("");
      setOrdonnanceFile(null);
      setMessage(null);
    } catch (error) {
      console.error("Erreur récupération historique :", error);
    }
  };

  // Fonction d'upload du fichier ordonnance sur Firebase Storage
  const uploadOrdonnanceImage = async (): Promise<string | null> => {
    if (!ordonnanceFile) return null;
    const fileRef = ref(storage, `ordonnances/${Date.now()}-${ordonnanceFile.name}`);
    setUploading(true);
    try {
      await uploadBytes(fileRef, ordonnanceFile);
      const url = await getDownloadURL(fileRef);
      return url;
    } catch (error) {
      console.error("Erreur upload ordonnance", error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedConsultation) {
      alert("Veuillez sélectionner une consultation.");
      return;
    }
    if (modifIndex === null) {
      alert("Veuillez sélectionner une réponse à modifier dans l'historique.");
      return;
    }
    if (!reponse.trim()) {
      alert("Veuillez remplir la réponse.");
      return;
    }

    setMessage(null);

    // Upload de l'image si fichier choisi, sinon conserve l'ancienne URL
    const ordonnanceUrl = ordonnanceFile ? await uploadOrdonnanceImage() : null;
    const { statutCollection: statut, ficheNumero } = selectedConsultation;

    try {

      let finalOrdonnanceUrl = historique[modifIndex].ordonnance;

if (ordonnanceFile) {
  const uploadedUrl = await uploadOrdonnanceImage();
  if (uploadedUrl) {
    finalOrdonnanceUrl = uploadedUrl;
  }
}

      await axios.put("/api/apiResultaReponse", {
        statut,
        ficheNumero,
        reponse,
        ordonnance: finalOrdonnanceUrl,
        index: modifIndex,
      });
      setMessage("Réponse modifiée avec succès !");
      setReponse("");
      setOrdonnanceFile(null);
      setModifIndex(null);
      fetchHistorique(ficheNumero, statut);
    } catch (error) {
      console.error("Erreur lors de la mise à jour", error);
      setMessage("Erreur lors de la modification.");
    }
  };

  const handleEditClick = (index: number) => {
    setReponse(historique[index].reponse);
    setModifIndex(index);
    setOrdonnanceFile(null);
    setMessage(null);
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className={styles.container2}>
      <div className={styles.blackBox}>
        <h1 className={styles.title2}>Liste des recommandations</h1>

        <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Entrer le numéro de fiche..."
            value={rechercheFicheNumero}
            onChange={(e) => setRechercheFicheNumero(e.target.value)}
            style={{
              padding: "10px",
              fontSize: "16px",
              flex: 1,
              color: "black",
              border: "1px solid #ccc",
              borderRadius: "5px 0 0 5px"
              
            }}
          />
          <button
            onClick={fetchConsultations}
            style={{
              padding: "10px 15px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "0 5px 5px 0",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <FaSearch />
          </button>
        </div>

        <ul className={styles.list2}>
          {consultations.map((consultation) => (
            <li
              key={consultation.id}
              className={styles.listItem2}
              style={{
                backgroundColor: consultation.statut === "NON" ? "#FC0909" : "#2D5DFA",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
              }}
              onClick={() => {
                setSelectedConsultation(consultation);
                fetchHistorique(consultation.ficheNumero, consultation.statutCollection);
              }}
            >
              {consultation.ficheNumero} ({consultation.statutCollection})
            </li>
          ))}
        </ul>
      </div>

      {selectedConsultation && (
        <div className={styles.card2}>
          <h2 className={styles.cardTitle2}>
            Fiche Médicale Numéro : {selectedConsultation.ficheNumero}
          </h2>

          <table className={styles.table2}>
            <thead>
              <tr>
                <th>Observations</th>
                <th>Données</th>
              </tr>
            </thead>
            <tbody>
             {Object.entries(selectedConsultation).map(([key, value]) =>
  !["id", "username", "ficheNumero", "statutCollection", "statut", "historique", "email"].includes(key) ? (
    <tr key={key}>
      <td>{fieldLabels[key] || key}</td>
      <td>{String(value)}</td>
    </tr>
  ) : null
)}
            </tbody>
          </table>

          <div ref={formRef} className={styles.reponseForm} style={{ marginTop: 20 }}>
            <h3>
              {modifIndex !== null
                ? `Modification de la réponse #${modifIndex + 1}`
                : "Modifier une réponse existante"}
            </h3>
            <textarea
              placeholder="Modifier la réponse..."
              value={reponse}
              onChange={(e) => setReponse(e.target.value)}
              rows={5}
              style={{ width: "100%" }}
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setOrdonnanceFile(e.target.files?.[0] || null)}
              style={{ marginTop: 10 }}
            />
            {uploading && <p>Envoi en cours...</p>}
            <button
              onClick={handleSubmit}
              disabled={modifIndex === null || uploading}
              style={{
                opacity: modifIndex === null ? 0.5 : 1,
                cursor: modifIndex === null ? "not-allowed" : "pointer",
                marginTop: 10,
              }}
            >
              Modifier
            </button>
            {message && <p>{message}</p>}
          </div>

          <div style={{ marginTop: 30 }}>
            <h3>Historique des Réponses</h3>
            {historique.length === 0 ? (
              <p>Aucune réponse pour le moment.</p>
            ) : (
              <table
                className={styles.table2}
                style={{ width: "100%", borderCollapse: "collapse" }}
              >
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Réponse</th>
                    <th>Ordonnance</th>
                    <th>Suivi</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {historique.map((entry, index) => (
                    <tr key={index} style={{ borderBottom: "1px solid #ccc" }}>
                      <td>{index + 1}</td>
                      <td>{entry.date}</td>
                      <td>{entry.reponse}</td>
                      <td>
                        {entry.ordonnance ? (
                          <a
                            href={entry.ordonnance}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Voir Ordonnance
                          </a>
                        ) : (
                          "Aucune"
                        )}
                      </td>
                      <td>
                        {entry.suivi && entry.suivi.length > 0 ? (
                          <table style={{ border: "1px solid #ccc", marginTop: 5, width: "100%" }}>
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Résultat</th>
                                
                              </tr>
                            </thead>
                            <tbody>
                              {entry.suivi.map((suiviItem, i) => (
                                <tr key={i}>
                                  <td>{suiviItem.date}</td>
                                  <td
  style={{ cursor: "pointer", color: "blue", textDecoration: "underline" }}
  onClick={() => {
    if (suiviItem.resultat2) {
      setImageUrl(suiviItem.resultat2);
      setIsModalOpen(true);
    }
  }}
>
  {suiviItem.resultat1}
</td>
                                  
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          "Aucun suivi"
                        )}
                      </td>
                      <td>
                        <button onClick={() => handleEditClick(index)}>
                          Modifier
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {isModalOpen && imageUrl && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0,0,0,0.7)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    }}
    onClick={() => setIsModalOpen(false)} // Ferme le modal si on clique en dehors
  >
    <img
      src={imageUrl}
      alt="Ordonnance"
      style={{
        maxWidth: "90%",
        maxHeight: "90%",
        borderRadius: "10px",
        boxShadow: "0 0 10px #fff",
        backgroundColor: "#fff",
      }}
      onClick={(e) => e.stopPropagation()} // Empêche de fermer en cliquant sur l'image
    />
  </div>
)}
        </div>
      )}
    </div>
  );
 

}