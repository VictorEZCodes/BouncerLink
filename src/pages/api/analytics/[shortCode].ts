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
      include: {
        visitLogs: {
          orderBy: { timestamp: "desc" },
          take: 10, // Get the last 10 visits
        },
      },
    });

    if (!link) {
      return res.status(404).json({ message: "Link not found" });
    }

    const analytics = {
      totalVisits: link.visits,
      lastVisited: link.lastVisitedAt,
      recentVisits: link.visitLogs.map((log) => ({
        timestamp: log.timestamp,
        userAgent: log.userAgent,
      })),
    };

    res.status(200).json(analytics);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ message: "Error fetching analytics" });
  }
}
