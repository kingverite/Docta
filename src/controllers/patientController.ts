import { createPatient } from "../models/patientModel";
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
//import { verifyPassword } from '../utils/passwords';
//import { hashPassword } from '../utils/passwords';

type PatientFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  gender: "male" | "female" | "other";
  address: string;
  passwords: string;
  age:string;
};

// Fonction pour gérer l'inscription d'un patient
 export const handlePatientRegistration = async (data: PatientFormData) => {
  try {
    const patientId = await createPatient(data); // Appelle le modèle
    return { success: true, id: patientId };
  } catch (error) {
    return { success: false, message: "erreur inattendu" };
  }
};

export const loginPatient = async (email: string, password: string) => {
  try {
    // Étape 1 : Rechercher l'utilisateur dans Firestore par email
    const q = query(collection(db, 'patients'), where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('Utilisateur introuvable');
    }

    // Étape 2 : Récupérer les données de l'utilisateur
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    // Étape 3 : Vérifier le mot de passe
    const isPasswordValid = await verifyPassword(password, userData.password);
    if (!isPasswordValid) {
      throw new Error('Mot de passe incorrect');
    }

    return 'Connexion réussie';
  } catch (error) {
    throw new Error('Erreur de connexion : erreur inattendu' );
  }
};