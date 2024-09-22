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
  uniqueVisitors: number;
  clickLimit: number | string;
  currentClicks: number;
  lastVisited: string | null;
  recentVisits: Array<{
    timestamp: string;
    userAgent: string;
    ipAddress: string;
    email: string | null;
  }>;
  allowedEmails: Array<{
    email: string;
    accessed: boolean;
  }>;
};

const LinksPage = () => {
  const { data: session } = useSession()
  const [links, setLinks] = useState<Link[]>([])
  const [selectedLink, setSelectedLink] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const linksPerPage = 10

  useEffect(() => {
    if (session) {
      fetchLinks(currentPage)
    }
  }, [session, currentPage])

  const fetchLinks = async (page: number) => {
    try {
      const response = await fetch(`/api/links?page=${page}&limit=${linksPerPage}`)
      if (!response.ok) {
        throw new Error('Failed to fetch links')
      }
      const data = await response.json()
      setLinks(data.links)
      setTotalPages(Math.ceil(data.total / linksPerPage))
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

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
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

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-center text-2xl">Please sign in to view your links.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>My Links - BouncerLink</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-center">My Shortened Links</h1>

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
                    <a href={`${process.env.NEXT_PUBLIC_BASE_URL}/${link.shortCode}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
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

        {links.length > 0 && (
          <div className="mt-4 flex justify-between">
            <Button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span>Page {currentPage} of {totalPages}</span>
            <Button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}

        {selectedLink && analytics && (
          <Card className="mt-8 bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Analytics for {selectedLink}</CardTitle>
            </CardHeader>
            <CardContent>
              <p><strong>Total Visits:</strong> {analytics.totalVisits}</p>
              <p><strong>Unique Visitors:</strong> {analytics.uniqueVisitors}</p>
              <p><strong>Click Limit:</strong> {analytics.clickLimit}</p>
              <p><strong>Current Clicks:</strong> {analytics.currentClicks}</p>
              <p><strong>Last Visited:</strong> {analytics.lastVisited ? new Date(analytics.lastVisited).toLocaleString() : 'Never'}</p>

              <h3 className="text-xl font-bold mt-4 mb-2">Recent Visits</h3>
              {analytics.recentVisits && analytics.recentVisits.length > 0 ? (
                <ul className="list-disc pl-5">
                  {analytics.recentVisits.map((visit, index) => (
                    <li key={index}>
                      {new Date(visit.timestamp).toLocaleString()} - {visit.userAgent}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No recent visits</p>
              )}

              <h3 className="text-xl font-bold mt-4 mb-2">Allowed Emails</h3>
              {analytics.allowedEmails && analytics.allowedEmails.length > 0 ? (
                <ul className="list-disc pl-5">
                  {analytics.allowedEmails.map((emailObj, index) => (
                    <li key={index}>
                      {emailObj.email} - {emailObj.accessed ? 'Accessed' : 'Not Accessed'}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No allowed emails</p>
              )}
            </CardContent>
          </Card>
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