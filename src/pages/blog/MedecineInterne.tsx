import styles from "@/styles/Form.module.css";
import Link from "next/link";
import Image from 'next/image';

const specialists = [
  { title: "Diabètologie", image: "/imagee/infectiologue.jpeg", link: "/MedecineI/infectiologue" },
  { title: "Pneumologie", image: "/imagee/pneumologue.jpeg", link: "/MedecineI/pneumologue" },
  { title: "Cardiologie", image: "/imagee/cardiologue.jpeg", link: "/MedecineI/cardiologue" },
  { title: "Gastro-enterologie", image: "/imagee/gastroEnterologue.jpeg", link: "/MedecineI/gastroEnterologue" },
  { title: "Nephologie", image: "/imagee/nephologue.jpeg", link: "/MedecineI/nephologue" },
  
];

const SpecialistCards = () => {
  return (
    <div className={styles.container2}>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", padding: "20px" }}>
      {specialists.map((specialist, index) => (
        <Link key={index} href={specialist.link}>
          <div style={{ 
            border: "1px solid #ccc", 
            borderRadius: "10px", 
            overflow: "hidden", 
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", 
            textAlign: "center", 
            cursor: "pointer", 
            backgroundColor: "#f9f9f9" 
          }}>
            <h2 style={{ 
              fontSize: "1.2em", 
              margin: "10px 0", 
              color: "#333", 
              fontWeight: "bold" 
            }}>
              {specialist.title}
            </h2>
            <Image
              src={specialist.image} 
              alt={specialist.title} 
              style={{ 
                width: "100%", 
                height: "150px", 
                objectFit: "cover" 
              }} 
            />
          </div>
        </Link>
      ))}
    </div>
    </div>
  );
};

export default SpecialistCards;