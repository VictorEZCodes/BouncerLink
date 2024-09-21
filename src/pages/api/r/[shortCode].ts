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

    console.log("Found link:", link); // Log the found link

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

    console.log("Redirecting to:", link.originalUrl); // Log the URL we're redirecting to

    // Redirect to the original URL
    res.redirect(301, link.originalUrl);
  } catch (error) {
    console.error("Error redirecting:", error);
    res.status(500).json({ message: "Error redirecting to original URL" });
  }
}
