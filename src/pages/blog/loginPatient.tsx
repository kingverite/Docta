import { useState } from "react";
import { useRouter } from "next/router";
import styles from "../../styles/Form.module.css";

const Login = () => {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (response.ok) {
      router.push("/dashboard");
    } else {
      alert("Invalid credentials");
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title1}>Login</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          className={styles.input}
          onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className={styles.input}
          onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
          required
        />
        <button type="submit" className={styles.button}>
          Login
        </button>
        <a onClick={() => router.push("/register")} className={styles.link}>
        <p>Don't have an account? Register here</p>
        </a>
      </form>
    </div>
  );
};

export default Login;