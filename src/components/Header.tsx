import styles from "@/styles/Form.module.css";

import Image from 'next/image';
const Header: React.FC = () => {
  return (
    <header className={styles.header}>
      <div className={styles.logoContainer}>
        <Image

          src="/imagee/logoo.png" // Remplacez par le chemin de votre logo
          alt="Logo Médical-council online"
          width={50} // Largeur du logo
          height={50} // Hauteur du logo
          className={styles.logo}
        />
        <h1 className={styles.title2}>Medical-council online</h1>
      </div>
    </header>
  );
};

export default Header;
