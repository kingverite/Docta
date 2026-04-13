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
          <li><Link href="/general/general2">ConsultationGénérale</Link></li>
          <li><Link href="/general/urgence2">Urgence</Link></li>
            

          </ul>
        </nav>
      </header>

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        <nav>
          <ul className={styles.menu}>
          <li><Link href="/general/general2">Consultation générale</Link></li>

          <li><Link href="/general/urgence2">Urgence</Link></li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={styles.content2}>
        
      </main>

      {/* Overlay */}
      {isSidebarOpen && <div className={styles.overlay2} onClick={toggleSidebar}></div>}
    </div>
  );
}