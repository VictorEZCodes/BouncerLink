import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { prisma } from "../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    try {
      const [links, total] = await prisma.$transaction([
        prisma.link.findMany({
          where: {
            userId: session.user.id,
          },
          select: {
            id: true,
            shortCode: true,
            url: true,
            originalUrl: true,
            visits: true,
            createdAt: true,
            lastVisitedAt: true,
            expiresAt: true,
            clickLimit: true,
            currentClicks: true,
            allowedEmails: true,
            associatedEmails: true,
            visitLogs: {
              orderBy: { timestamp: "desc" },
              take: 10,
              select: {
                timestamp: true,
                userAgent: true,
                ipAddress: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: limit,
        }),
        prisma.link.count({ where: { userId: session.user.id } }),
      ]);

      const linksWithAnalytics = links.map((link) => ({
        ...link,
        analytics: {
          totalVisits: link.visits,
          uniqueVisitors: new Set(
            link.visitLogs.map((log) => log.email).filter(Boolean)
          ).size,
          clickLimit: link.clickLimit || "No limit",
          currentClicks: link.currentClicks,
          lastVisited: link.lastVisitedAt || "Never",
          recentVisits: link.visitLogs,
          allowedEmails: link.allowedEmails,
          associatedEmails: link.associatedEmails,
        },
      }));

      return res.status(200).json({
        links: linksWithAnalytics,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error("Error fetching links:", error);
      return res.status(500).json({ error: "Error fetching links" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
