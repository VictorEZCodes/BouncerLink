import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { prisma } from "../../lib/prisma";
import { nanoid } from "nanoid";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

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
    customShortCode,
  } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    let shortCode = customShortCode;

    if (shortCode) {
      // Check if the custom short code is already in use
      const existingLink = await prisma.link.findUnique({
        where: { shortCode },
      });

      if (existingLink) {
        return res
          .status(400)
          .json({ error: "Custom short code is already in use" });
      }
    } else {
      // Generate a random short code if no custom code is provided
      shortCode = nanoid(8);
    }

    // Convert expiresAt to UTC Date object
    const expirationDate = expiresAt
      ? new Date(new Date(expiresAt).toUTCString())
      : null;

    let newLink;

    if (session) {
      // User is authenticated, create a full link
      newLink = await prisma.link.create({
        data: {
          url,
          originalUrl: url,
          shortCode,
          expiresAt: expirationDate,
          notificationsEnabled: notificationsEnabled ?? true,
          accessCode: accessCode || null,
          allowedEmails: allowedEmails || [],
          associatedEmails: allowedEmails || [],
          clickLimit: clickLimit ? parseInt(clickLimit) : null,
          user: {
            connect: { id: session.user.id },
          },
        },
      });
    } else {
      // User is not authenticated, create a temporary link
      newLink = await prisma.link.create({
        data: {
          url,
          originalUrl: url,
          shortCode,
          expiresAt: new Date(
            new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString()
          ), // Expires in 24 hours, in UTC
          notificationsEnabled: false,
          accessCode: null,
          allowedEmails: [],
          associatedEmails: [],
          clickLimit: null,
        },
      });
    }

    if (!newLink) {
      throw new Error("Failed to create link");
    }

    console.log("New link created:", newLink);
    console.log("Expiration date:", newLink.expiresAt?.toUTCString());

    return res.status(200).json({
      shortUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/${shortCode}`,
      shortCode,
      expiresAt: newLink.expiresAt,
      isAuthenticated: !!session,
    });
  } catch (error) {
    console.error("Error creating short link:", error);
    return res.status(500).json({ error: "Error creating short link" });
  } finally {
    await prisma.$disconnect();
  }
}
