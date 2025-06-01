import styles from "@/styles/Form.module.css";
import Image from "next/image";
import Link from "next/link";

const specialists = [
  { title: "Pediatrie générale", image: "/imagee/pediatrieGN.png", link: "/Pediatre/pediatrieGN" },
  { title: "Néonatologie", image: "/imagee/neuropediatre.jpg", link: "/Pediatre/neuropediatre" },
  { title: "Conseil Nutritionel", image: "/imagee/cardiopediatre.jpg", link: "/Pediatre/cardiopediatre" },
  
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
  width={300} // largeur souhaitée
  height={200} // hauteur souhaitée
  style={{
    objectFit: "cover",
    width: "100%", // pour qu'il s'adapte au parent
    height: "150px",
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