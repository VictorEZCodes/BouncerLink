// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { PrismaClient } from "@prisma/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { shortCode } = req.query;

  if (typeof shortCode !== "string") {
    return res.status(400).json({ error: "Invalid short code" });
  }

  try {
    const analytics = await prisma.$transaction(
      async (prismaClient: PrismaClient) => {
        const link = await prismaClient.link.findUnique({
          where: { shortCode },
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

        if (!link) {
          throw new Error("Link not found");
        }

        // Count unique visitors
        const uniqueVisitorsCount = await prismaClient.visitLog.groupBy({
          by: ["ipAddress", "userAgent"],
          where: { linkId: link.id },
          _count: true,
        });

        // Get unique emails that have accessed the link
        const accessedEmails = await prismaClient.visitLog.findMany({
          where: { linkId: link.id, email: { not: null } },
          select: { email: true },
          distinct: ["email"],
        });

        const accessedEmailSet = new Set(
          accessedEmails.map((log) => log.email)
        );

        return {
          totalVisits: link.visits,
          uniqueVisitors: uniqueVisitorsCount.length,
          clickLimit: link.clickLimit || "No limit",
          currentClicks: link.currentClicks,
          lastVisited: link.lastVisitedAt || "Never",
          recentVisits: link.visitLogs.map((log) => ({
            timestamp: log.timestamp,
            userAgent: log.userAgent,
            ipAddress: log.ipAddress,
            email: log.email,
          })),
          allowedEmails: link.allowedEmails.map((email) => ({
            email,
            accessed: accessedEmailSet.has(email),
          })),
          associatedEmails: link.associatedEmails,
        };
      }
    );

    res.status(200).json(analytics);
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
