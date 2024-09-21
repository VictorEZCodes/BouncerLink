import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { Button } from "@/components/ui/button"

type Link = {
  id: string;
  shortCode: string;
  originalUrl: string;
  visits: number;
  createdAt: string;
  lastVisitedAt: string | null;
}

type Analytics = {
  totalVisits: number;
  lastVisited: string | null;
  recentVisits: { timestamp: string; userAgent: string | null }[];
}

const LinksPage = () => {
  const [links, setLinks] = useState<Link[]>([])
  const [selectedLink, setSelectedLink] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)

  useEffect(() => {
    fetchLinks()
  }, [])

  const fetchLinks = async () => {
    try {
      const response = await fetch('/api/links')
      if (!response.ok) {
        throw new Error('Failed to fetch links')
      }
      const data = await response.json()
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2 text-black">
      <Head>
        <title>All Links - BouncerLink</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex w-full flex-1 flex-col items-center justify-center px-20 text-center">
        <h1 className="text-4xl font-bold mb-8">All Shortened Links</h1>

        <div className="w-full max-w-4xl">
          <div className="bg-white shadow-md rounded my-6">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Short Code</th>
                  <th className="py-3 px-6 text-left">Original URL</th>
                  <th className="py-3 px-6 text-center">Visits</th>
                  <th className="py-3 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm font-light">
                {links.map((link) => (
                  <tr key={link.id} className="border-b border-gray-200 hover:bg-gray-100">
                    <td className="py-3 px-6 text-left whitespace-nowrap">
                      <a href={`${process.env.NEXT_PUBLIC_BASE_URL}/api/r/${link.shortCode}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {link.shortCode}
                      </a>
                    </td>
                    <td className="py-3 px-6 text-left">
                      <a href={link.originalUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {link.originalUrl.length > 30 ? link.originalUrl.substring(0, 30) + '...' : link.originalUrl}
                      </a>
                    </td>
                    <td className="py-3 px-6 text-center">{link.visits}</td>
                    <td className="py-3 px-6 text-center">
                      <Button onClick={() => fetchAnalytics(link.shortCode)}>View Analytics</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedLink && analytics && (
          <div className="mt-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Analytics for {selectedLink}</h2>
            <div className="bg-gray-100 p-4 rounded-lg">
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
            </div>
          </div>
        )}

        <Link href="/" className="mt-8">
          <Button>Back to Home</Button>
        </Link>
      </main>
    </div>
  )
}

export default LinksPage