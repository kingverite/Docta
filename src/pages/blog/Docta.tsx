import styles from "@/styles/Form.module.css";
import { useState, useEffect } from "react";
import axios from "axios";
import React from "react";
import Cookies from "js-cookie";
import { FaSearch } from "react-icons/fa";

interface Consultation {
  username: string;
  ficheNumero: string;
  id: string;
  age: number;
  specialite: string;
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

interface Suivi {
  date: string;
  resultat1: string;
  resultat2 : string;
  commentaire: string;
}

interface Reponse {
  reponse: string;
  ordonnance: string;
  date: string;
  suivi?: Suivi[];
}

export default function ConsultationsList() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [reponse, setReponse] = useState<string>("");
  const [ordonnance, setOrdonnance] = useState<string>("");
  const [historique, setHistorique] = useState<Reponse[]>([]);
  const [rechercheFicheNumero, setRechercheFicheNumero] = useState<string>("");

  const statut = Cookies.get("statut");

  // Fonction pour récupérer les consultations filtrées côté backend par ficheNumero
  const fetchConsultations = async () => {
    if (!rechercheFicheNumero || !statut) {
      alert("Veuillez entrer le ficheNumero et le statut");
      return;
    }

    try {
      const response = await axios.get<Consultation[]>("/api/apiSearchFiche", {
        params: {
          ficheNumero: rechercheFicheNumero,
          statut: statut,
        },
      });
      setConsultations(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement des consultations :", error);
    }
  };

  // À chaque changement du champ recherche on refait la requête
  


  useEffect(() => {
    if (!statut) {
      console.error("Aucun statut trouvé dans le cookie.");
      return;
    }

    axios.get<Consultation[]>("/api/apiDocta", { params: { statut } })
      .then(response => setConsultations(response.data))
      .catch(error => console.error("Erreur lors de la récupération des consultations", error));
  }, [statut]);

  const fetchHistorique = async (ficheNumero: string) => {
    console.log("statttttt", statut)
    console.log("ficheNumeroooo", ficheNumero)
    try {
      const res = await axios.get<Reponse[]>("/api/apiHistorique", {
        params: { statut, ficheNumero },
      });
      setHistorique(res.data);
    } catch (err) {
      console.error("Erreur lors de la récupération de l'historique", err);
    }
  };

  const handleSubmit = async () => {
    if (!selectedConsultation || !statut) return;

    if (!reponse.trim() || !ordonnance.trim()) {
      alert("Veuillez remplir à la fois la réponse et l'ordonnance ");
      return;
    }

    try {
      await axios.post("/api/apiRepondre", {
        statut,
        ficheNumero: selectedConsultation.ficheNumero,
        reponse,
        ordonnance,
      });
      setReponse("");
      setOrdonnance("");
      fetchHistorique(selectedConsultation.ficheNumero);
    } catch (error) {
      console.error("Erreur lors de l'envoi de la réponse", error);
    }
  };

  const handleModifier = async (index: number) => {
    if (!selectedConsultation || !statut) return;

    if (!reponse.trim() || !ordonnance.trim()) {
      alert("Veuillez remplir à la fois la réponse et l'ordonnance avant de modifier.");
      return;
    }

    try {
      console.log("statut", statut);
      console.log("ficheNumero", selectedConsultation.ficheNumero);
      console.log("index", index);
      console.log("reponse", reponse);
      console.log("ordonnance", ordonnance);
      await axios.put("/api/apiRepondre", {
        statut,
        ficheNumero: selectedConsultation.ficheNumero,
        index,
        reponse,
        ordonnance,
      });
      fetchHistorique(selectedConsultation.ficheNumero);
    } catch (error) {
      console.error("Erreur lors de la modification", error);
    }
  };

  return (
    <div className={styles.container2}>
      <div className={styles.blackBox}>
        <h1 className={styles.title2}>Liste des Consultations</h1>
        

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
          {consultations.map(consultation => (
            <li
              key={consultation.id}
              className={styles.listItem2}
              onClick={() => {
                setSelectedConsultation(consultation);
                fetchHistorique(consultation.ficheNumero);
              }}
            >
              {consultation.ficheNumero} {consultation.specialite}
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
                <th>Champ</th>
                <th>Valeur</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(selectedConsultation).map(([key, value]) =>
                key !== "id" && key !== "name" ? (
                  <tr key={key}>
                    <td>{key}</td>
                    <td>{String(value)}</td>
                  </tr>
                ) : null
              )}
            </tbody>
          </table>

          <div className={styles.reponseForm}>
            <h3>Répondre à cette fiche</h3>
            <textarea
              placeholder="Réponse..."
              value={reponse}
              onChange={(e) => setReponse(e.target.value)}
            />
            <textarea
              placeholder="Ordonnance..."
              value={ordonnance}
              onChange={(e) => setOrdonnance(e.target.value)}
            />
            <button onClick={handleSubmit}>Envoyer</button>
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
                      <td>{entry.ordonnance}</td>
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
                                <th>Résultat 1</th>
                                <th>Résultat 2</th>
                              </tr>
                            </thead>
                            <tbody>
                              {entry.suivi.map((suiviItem, i) => (
                                <tr key={i}>
                                  <td>{suiviItem.date}</td>
                                  <td>{suiviItem.resultat1}</td>
                                  <td>{suiviItem.resultat2}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          "Aucun suivi"
                        )}
                      </td>
                      <td>
                        <button onClick={() => {
                  setReponse(entry.reponse);
                  setOrdonnance(entry.ordonnance);
                  handleModifier(index);
                }}>
                  Modifier
                </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}