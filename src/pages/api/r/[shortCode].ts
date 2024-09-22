import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import { sendNotificationEmail } from "../../../lib/sendEmail";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { shortCode } = req.query;
  const { accessCode, email } = req.body;

  if (typeof shortCode !== "string") {
    return res.status(400).json({ message: "Invalid short code" });
  }

  try {
    const link = await prisma.link.findUnique({
      where: { shortCode: shortCode },
      include: { user: true },
    });

    if (!link) {
      return res.status(404).json({ message: "Link not found" });
    }

    // Check if the link has expired
    if (link.expiresAt && new Date() > new Date(link.expiresAt)) {
      return res.status(410).json({ message: "Link has expired" });
    }

    // Check if click limit has been reached
    if (link.clickLimit !== null && link.currentClicks >= link.clickLimit) {
      return res
        .status(410)
        .json({ message: "Link has reached its click limit" });
    }

    if (req.method === "GET") {
      // If access control is required, redirect to the access page
      if (
        link.accessCode ||
        (link.allowedEmails && link.allowedEmails.length > 0)
      ) {
        return res.redirect(`/access/${shortCode}`);
      }
      // If no access control is required, process the visit and redirect
      await processVisit(link, req);
      return res.redirect(301, link.url);
    } else if (req.method === "POST") {
      // Check access code if set
      if (link.accessCode && link.accessCode !== accessCode) {
        return res.status(403).json({ message: "Invalid access code" });
      }

      // Check allowed emails if set
      if (link.allowedEmails && link.allowedEmails.length > 0) {
        if (!email || !link.allowedEmails.includes(email)) {
          return res.status(403).json({ message: "Email not authorized" });
        }
      }

      // Process the visit and return the URL
      await processVisit(link, req);
      return res.status(200).json({ url: link.url });
    }

    // If we reach here, it's an unsupported method
    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Error processing link:", error);
    return res.status(500).json({ message: "Error processing link" });
  }
}

async function processVisit(link: any, req: NextApiRequest) {
  // Send notification email if enabled
  if (link.notificationsEnabled && link.user.email) {
    await sendNotificationEmail(link.user.email, link.shortCode);
  }

  // Increment currentClicks and update lastVisitedAt
  await prisma.link.update({
    where: { id: link.id },
    data: {
      currentClicks: { increment: 1 },
      visits: { increment: 1 },
      lastVisitedAt: new Date(),
    },
  });

  // Log visit with IP address and user agent for unique visitor tracking
  const ipAddress =
    req.headers["x-forwarded-for"]?.toString() ||
    req.socket.remoteAddress ||
    null;
  const userAgent = req.headers["user-agent"] || null;

  await prisma.visitLog.create({
    data: {
      linkId: link.id,
      ipAddress,
      userAgent,
    },
  });
}
