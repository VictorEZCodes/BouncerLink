// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";
import { PrismaClient } from "@prisma/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  const { shortCode } = req.query;

  if (typeof shortCode !== "string") {
    return res.status(400).json({ error: "Invalid short code" });
  }

  try {
    const link = await prisma.link.findUnique({
      where: { shortCode },
      select: { id: true, userId: true },
    });

    if (!link) {
      return res.status(404).json({ error: "Link not found" });
    }

    // For non-authenticated users or users who don't own the link, return limited data
    if (!session || session.user.id !== link.userId) {
      const basicAnalytics = await prisma.link.findUnique({
        where: { id: link.id },
        select: { visits: true },
      });
      return res.status(200).json({
        totalVisits: basicAnalytics?.visits || 0,
        isAuthenticated: !!session,
      });
    }

    // Proceed with full analytics for authenticated owner
    const analytics = await prisma.$transaction(
      async (prismaClient: PrismaClient) => {
        const fullLink = await prismaClient.link.findUnique({
          where: { id: link.id },
          include: {
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
        });

        if (!fullLink) {
          throw new Error("Link not found");
        }

        // Count unique visitors
        const uniqueVisitorsCount = await prismaClient.visitLog.groupBy({
          by: ["ipAddress", "userAgent"],
          where: { linkId: fullLink.id },
          _count: true,
        });

        // Get unique emails that have accessed the link
        const accessedEmails = await prismaClient.visitLog.findMany({
          where: { linkId: fullLink.id, email: { not: null } },
          select: { email: true },
          distinct: ["email"],
        });

        const accessedEmailSet = new Set(
          accessedEmails.map((log) => log.email)
        );

        return {
          totalVisits: fullLink.visits,
          uniqueVisitors: uniqueVisitorsCount.length,
          clickLimit: fullLink.clickLimit || "No limit",
          currentClicks: fullLink.currentClicks,
          lastVisited: fullLink.lastVisitedAt || "Never",
          recentVisits: fullLink.visitLogs.map((log) => ({
            timestamp: log.timestamp,
            userAgent: log.userAgent,
            ipAddress: log.ipAddress,
            email: log.email,
          })),
          allowedEmails: fullLink.allowedEmails.map((email) => ({
            email,
            accessed: accessedEmailSet.has(email),
          })),
          associatedEmails: fullLink.associatedEmails,
        };
      }
    );

    res.status(200).json({ ...analytics, isAuthenticated: true });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    if (error instanceof Error && error.message === "Link not found") {
      res.status(404).json({ error: "Link not found" });
    } else {
      res.status(500).json({ error: "Error fetching analytics" });
    }
  } finally {
    await prisma.$disconnect();
  }
}
