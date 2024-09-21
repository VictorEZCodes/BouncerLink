import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";

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
    });

    if (!link) {
      return res.status(404).json({ message: "Link not found" });
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
    res.redirect(301, link.originalUrl);
  } catch (error) {
    console.error("Error redirecting:", error);
    res.status(500).json({ message: "Error redirecting to original URL" });
  }
}
