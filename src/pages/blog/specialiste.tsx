//import styles from '@/styles/Specialiste.module.css';
import styles from "@/styles/Form.module.css";
import Link from 'next/link';
import { useState } from 'react';



export default function Specialiste() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className={styles.container2}>
     

      {/* Toolbar avec les spécialités */}
      <header className={styles.toolbar2}>
        <button onClick={toggleSidebar} className={styles.menuButton}>
          ☰
        </button>
        <h1 className={styles.title}></h1>
        <nav>
          <ul className={styles.specialtiesMenu}>
          <li><Link href="/blog/MedecineInterne">Medecine Interne</Link></li>
            <li><Link href="/blog/Gynecologue">Gynécologie et obstétrique</Link></li>
            <li><Link href="/blog/Neurochirurgien">Churirgie</Link></li>
            <li><Link href="/blog/Pediatre">Pédiatrie</Link></li>
            <li><Link href="/blog/Ophtalmologue">Ophtalmologie</Link></li>
            <li><Link href="/blog/ORL">ORL</Link></li>
            <li><Link href="/blog/Dermologue">Dermologie</Link></li>
      
            <li><Link href="/blog/Psychiatre">Psychiatrie</Link></li>
            <li><Link href="/blog/Neurologue">Neurologie</Link></li>
            <li><Link href="/blog/Vaccin">Vaccinologie</Link></li>
            <li><Link href="/blog/Vaccin">Autres</Link></li>
            
          </ul>
        </nav>
      </header>

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        <nav>
          <ul className={styles.menu}>
          <li>
        <Link href="/blog/pageAcceuil">Acceuil</Link>
      </li>
            <li>Réception</li>
            <li>Urgence</li>
            <li>Médecin généraliste</li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={styles.content2}>
        <h2>Médecins Spécialistes</h2>
        <p>Bienvenue sur la page des spécialités médicales. Cliquez sur une spécialité pour en savoir plus.</p>
      </main>

      {/* Overlay */}
      {isSidebarOpen && <div className={styles.overlay2} onClick={toggleSidebar}></div>}
    </div>
  );
}