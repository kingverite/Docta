import type { NextApiRequest, NextApiResponse } from "next";

type DiagnosticResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DiagnosticResponse>
) {
  // Autoriser uniquement les requêtes GET.
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Méthode non autorisée.",
    });
  }

  // Vérifier les variables sans afficher leurs valeurs.
  const baseUrl = process.env.DIGITALOCEAN_API_URL;
  const secret = process.env.INTERNAL_API_SECRET;

  if (!baseUrl || !secret) {
    return res.status(500).json({
      success: false,
      error: "Configuration serveur incomplète.",
    });
  }

  // Vérifier le format de l'adresse.
  let url: URL;

  try {
    url = new URL(baseUrl);
  } catch {
    return res.status(500).json({
      success: false,
      error: "Adresse DigitalOcean invalide.",
    });
  }

  if (url.protocol !== "https:") {
    return res.status(500).json({
      success: false,
      error: "Une adresse HTTPS est requise.",
    });
  }

  try {
    const response = await fetch(
      `${baseUrl.replace(/\/+$/, "")}/api/health/internal`,
      {
        method: "GET",
        headers: {
          "X-Internal-Secret": secret,
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      return res.status(502).json({
        success: false,
        error:
          response.status === 401
            ? "Le secret interne est refusé par DigitalOcean."
            : `DigitalOcean a répondu avec le code ${response.status}.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Connexion HTTPS et authentification interne réussies.",
    });
  } catch {
    return res.status(502).json({
      success: false,
      error: "Connexion à DigitalOcean impossible.",
    });
  }
}
