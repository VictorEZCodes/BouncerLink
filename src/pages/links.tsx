import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

type Link = {
  id: string;
  shortCode: string;
  url: string;
  visits: number;
  createdAt: string;
  lastVisitedAt: string | null;
  expiresAt: string | null;
}

type Analytics = {
  totalVisits: number;
  lastVisited: string | null;
  recentVisits: { timestamp: string; userAgent: string | null }[];
}

const LinksPage = () => {
  const { data: session } = useSession()
  const [links, setLinks] = useState<Link[]>([])
  const [selectedLink, setSelectedLink] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)

  useEffect(() => {
    if (session) {
      fetchLinks()
    }
  }, [session])

  const fetchLinks = async () => {
    try {
      const response = await fetch('/api/links')
      if (!response.ok) {
        throw new Error('Failed to fetch links')
      }
      const data = await response.json()
      console.log('Fetched links:', data) // Add this line
      setLinks(data)
    } catch (error) {
      console.error('Error fetching links:', error)
    }
  }

  const fetchAnalytics = async (shortCode: string) => {
    try {
      const response = await fetch(`/api/analytics/${shortCode}`)
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }
      const data = await response.json()
      setAnalytics(data)
      setSelectedLink(shortCode)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  const truncateUrl = (url: string) => {
    if (!url) return 'N/A';
    return url.length > 30 ? url.substring(0, 30) + '...' : url;
  }

  const formatExpirationDate = (expiresAt: string | null) => {
    if (!expiresAt) return 'Never';
    const expirationDate = new Date(expiresAt);
    if (isNaN(expirationDate.getTime())) {
      console.error('Invalid date:', expiresAt);
      return 'Invalid Date';
    }
    return expirationDate.toLocaleString();
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>My Links - BouncerLink</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center">My Shortened Links</h1>

        {session ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-800 text-gray-300 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left">Short Code</th>
                    <th className="py-3 px-6 text-left">Original URL</th>
                    <th className="py-3 px-6 text-center">Visits</th>
                    <th className="py-3 px-6 text-center">Expires At</th>
                    <th className="py-3 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300 text-sm font-light">
                  {links.map((link) => (
                    <tr key={link.id} className="border-b border-gray-700 hover:bg-gray-800">
                      <td className="py-3 px-6 text-left whitespace-nowrap">
                        <a href={`${process.env.NEXT_PUBLIC_BASE_URL}/api/r/${link.shortCode}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                          {link.shortCode}
                        </a>
                      </td>
                      <td className="py-3 px-6 text-left">
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                          {truncateUrl(link.url)}
                        </a>
                      </td>
                      <td className="py-3 px-6 text-center">{link.visits}</td>
                      <td className="py-3 px-6 text-center">
                        {formatExpirationDate(link.expiresAt)}
                      </td>
                      <td className="py-3 px-6 text-center">
                        <Button onClick={() => fetchAnalytics(link.shortCode)}>View Analytics</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedLink && analytics && (
              <Card className="mt-8 bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Analytics for {selectedLink}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-2"><strong>Total Visits:</strong> {analytics.totalVisits}</p>
                  <p className="mb-4"><strong>Last Visited:</strong> {analytics.lastVisited ? new Date(analytics.lastVisited).toLocaleString() : 'Never'}</p>
                  <h3 className="text-xl font-bold mb-2">Recent Visits</h3>
                  <ul className="list-disc pl-5">
                    {analytics.recentVisits.map((visit, index) => (
                      <li key={index} className="mb-1">
                        {new Date(visit.timestamp).toLocaleString()} - {visit.userAgent}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <p className="text-center">Please sign in to view your links.</p>
        )}

        <div className="mt-8 text-center">
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </main>
    </div>
  )
}

export default LinksPage