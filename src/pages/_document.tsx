import { Html, Head, Main, NextScript } from "next/document";
import Header from '../components/Header';

export default function Document() {
  return (
    <Html lang="fr">
      <Head>
        {/* Balise meta viewport à ajouter ici */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {/* Autres balises meta ou liens ici */}
      </Head>

      <Header />
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
