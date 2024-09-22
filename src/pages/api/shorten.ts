import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { prisma } from "../../lib/prisma"; // Change this to use the singleton instance
import { nanoid } from "nanoid";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    url,
    expiresAt,
    notificationsEnabled,
    accessCode,
    allowedEmails,
    clickLimit,
  } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const shortCode = nanoid(8);
    const newLink = await prisma.link.create({
      data: {
        url,
        originalUrl: url,
        shortCode,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        notificationsEnabled: notificationsEnabled ?? true,
        accessCode: accessCode || null,
        allowedEmails: allowedEmails || [],
        associatedEmails: allowedEmails || [], // Use allowedEmails for associatedEmails as well
        clickLimit: clickLimit ? parseInt(clickLimit) : null,
        user: {
          connect: { id: session.user.id },
        },
      },
    });

    if (!newLink) {
      throw new Error("Failed to create link");
    }

    console.log("New link created:", newLink);

    return res.status(200).json({
      shortUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/r/${shortCode}`,
      shortCode,
      expiresAt: newLink.expiresAt,
    });
  } catch (error) {
    console.error("Error creating short link:", error);
    return res.status(500).json({ error: "Error creating short link" });
  } finally {
    await prisma.$disconnect();
  }
}
