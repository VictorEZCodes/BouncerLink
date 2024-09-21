import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import prisma from "../../lib/prisma";
import { nanoid } from "nanoid";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ message: "URL is required" });
  }

  try {
    const shortCode = nanoid(8);
    const newLink = await prisma.link.create({
      data: {
        url: url,
        originalUrl: url,
        shortCode: shortCode,
        userId: session.user.id,
      },
    });

    return res.status(200).json({
      shortUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/r/${shortCode}`,
      shortCode,
    });
  } catch (error) {
    console.error("Error creating short link:", error);
    return res.status(500).json({ message: "Error creating short link" });
  }
}
