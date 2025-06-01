import styles from "@/styles/Form.module.css";
import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
    const toggleSidebar = () => {
      setIsSidebarOpen(!isSidebarOpen);
    };
  
    return (
      <div className={styles.container2}>
        {/* Toolbar */}
        <header className={styles.toolbar1}>
          <button onClick={toggleSidebar} className={styles.menuButton}>
            ☰
          </button>
          <h1 className={styles.title}></h1>
        </header>
  
        {/* Sidebar */}
        <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
          <nav>
            <ul className={styles.menu}>
              <li>Réception</li>
              <li>Urgence</li>
              <li>Médecin généraliste</li>
              <li>
        <Link href="/blog/specialiste">Médecin spécialiste</Link>
      </li>
        <li>
        <Link href="/blog/resultats">Résultats</Link>
      </li>
            </ul>
          </nav>
        </aside>
  
        {/* Main Content */}
        <main className={styles.content2}>
          {/* Ajoutez ici le contenu principal */}
        </main>
  
        {/* Overlay (quand la sidebar est ouverte) */}
        {isSidebarOpen && <div className={styles.overlay2} onClick={toggleSidebar}></div>}
      </div>
    );
  }