import { db } from "../lib/firebase";
import { collection, addDoc } from "firebase/firestore";

type PatientData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  gender: "male" | "female" | "other";
  address: string;
  passwords:string;
  age:string;
};

// Fonction pour ajouter un patient dans Firestore
export const createPatient = async (data: PatientData) => {
  try {
    const docRef = await addDoc(collection(db, "patients"), data);
    return docRef.id; // Renvoie l'ID du document créé
  } catch (error) {
    console.error("Erreur lors de l'ajout du patient :", error);
    throw new Error("Erreur lors de l'ajout du patient");
  }
};
