import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import prisma from "../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    try {
      const links = await prisma.link.findMany({
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
          expiresAt: true, // Make sure this line is included
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return res.status(200).json(links);
    } catch (error) {
      console.error("Error fetching links:", error);
      return res.status(500).json({ error: "Error fetching links" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
