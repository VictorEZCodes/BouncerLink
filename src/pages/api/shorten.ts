import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/prisma";
import { nanoid } from "nanoid";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ message: "URL is required" });
  }

  try {
    const shortCode = nanoid(8); // Generate a short code
    const newLink = await prisma.link.create({
      data: {
        originalUrl: url,
        shortCode,
      },
    });

    console.log("Created new link:", newLink); // Log the created link

    return res.status(200).json({
      shortUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/r/${shortCode}`,
      shortCode,
    });
  } catch (error) {
    console.error("Error creating short link:", error);
    return res.status(500).json({ message: "Error creating short link" });
  }
}
