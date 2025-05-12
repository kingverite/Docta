import styles from "@/styles/Form.module.css";
import { useState, useEffect } from "react";
import axios from "axios";
import React from "react";


interface Consultation {
  id: string;
  name: string;
  age: number;
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

export default function ConsultationsList() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);

  useEffect(() => {
    axios.get<Consultation[]>("/api/apiDocta")
      .then(response => setConsultations(response.data))
      .catch(error => console.error("Erreur lors de la récupération des consultations", error));
  }, []);

  return (
    <div className={styles.container2}>
      <h1 className={styles.title2}>Liste des Consultations</h1>
      <ul className={styles.list2}>
        {consultations.map(consultation => (
          <li 
            key={consultation.id} 
            className={styles.listItem2}
            onClick={() => setSelectedConsultation(consultation)}
          >
            {consultation.name}
          </li>
        ))}
      </ul>
      {selectedConsultation && (
        <div className={styles.card2}>
          <h2 className={styles.cardTitle2}>Fiche Médicale de {selectedConsultation.name}</h2>
          <table className={styles.table2}>
            <thead>
              <tr>
                <th>Examens</th>
                <th>Resultats</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(selectedConsultation).map(([key, value]) => (
                 key !== "id" && key !== "name" && (
                  <tr key={key}>
                    <td className={styles.tableKey2}>{key}</td>
                    <td>{String(value)}</td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
          <label>Examens médicaux passés :</label>
      
        </div>
        
      )}
    </div>
  );
}
