import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import { sendNotificationEmail } from "../../../lib/sendEmail";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { shortCode } = req.query;

  if (typeof shortCode !== "string") {
    return res.status(400).json({ message: "Invalid short code" });
  }

  try {
    const link = await prisma.link.findUnique({
      where: { shortCode: shortCode },
      include: { user: true }, // Include user data to get the email
    });

    if (!link) {
      return res.status(404).json({ message: "Link not found" });
    }

    // Check if the link has expired
    if (link.expiresAt && new Date() > new Date(link.expiresAt)) {
      return res.status(410).json({ message: "Link has expired" });
    }

    // Send notification email if enabled
    if (link.notificationsEnabled && link.user.email) {
      await sendNotificationEmail(link.user.email, shortCode);
    }

    // Update visit count and last visited time
    await prisma.link.update({
      where: { id: link.id },
      data: {
        visits: { increment: 1 },
        lastVisitedAt: new Date(),
      },
    });

    // Log visit
    await prisma.visitLog.create({
      data: {
        linkId: link.id,
        userAgent: req.headers["user-agent"] || null,
        ipAddress:
          req.headers["x-forwarded-for"]?.toString() ||
          req.socket.remoteAddress ||
          null,
      },
    });

    // Redirect to the original URL
    res.redirect(301, link.url);
  } catch (error) {
    console.error("Error redirecting:", error);
    res.status(500).json({ message: "Error redirecting to original URL" });
  }
}
