import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

type SerdiTokenResponse = {
  access_token: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const response = await axios.post<SerdiTokenResponse>(
      "https://serdipay.com/api/public-api/v1/merchant/get-token",
      {
        email: process.env.SERDI_EMAIL,
        password: process.env.SERDI_PASSWORD,
      }
    );

    res.status(200).json({ token: response.data.access_token });
  } catch {
    res.status(500).json({ error: "Token error" });
  }
}