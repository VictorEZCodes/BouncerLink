import Link from 'next/link'
import type { NextPage } from 'next'
import Head from 'next/head'
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Analytics = {
  totalVisits: number;
  lastVisited: string | null;
  recentVisits: { timestamp: string; userAgent: string | null }[];
};

const Home: NextPage = () => {
  const [url, setUrl] = useState('')
  const [shortUrl, setShortUrl] = useState('')
  const [analytics, setAnalytics] = useState<Analytics | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const response = await fetch('/api/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    const data = await response.json()
    setShortUrl(data.shortUrl)
    setAnalytics(null)
  }

  const fetchAnalytics = async () => {
    if (!shortUrl) return;
    const shortCode = shortUrl.split('/').pop();
    try {
      const response = await fetch(`/api/analytics/${shortCode}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics(null);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <Head>
        <title>BouncerLink</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex w-full flex-1 flex-col items-center justify-center px-20 text-center">
        <h1 className="text-6xl font-bold mb-8">
          Welcome to <span className="text-blue-600">BouncerLink</span>
        </h1>

        <form onSubmit={handleSubmit} className="w-full max-w-md">
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter your URL here"
            required
            className="mb-4"
          />
          <Button type="submit" className="w-full">Shorten URL</Button>
        </form>

        {shortUrl && (
          <div className="mt-8 flex flex-col items-center">
            <p className="mb-2">Your shortened URL:</p>
            <a href={shortUrl} className="text-blue-600 hover:underline mb-4">{shortUrl}</a>
            <Button onClick={fetchAnalytics} className="w-full max-w-md">View Analytics</Button>
          </div>
        )}

        {analytics && (
          <div className="mt-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-black">Analytics</h2>
            <div className="bg-gray-100 p-4 rounded-lg text-black">
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

        <Link href="/links" className="mt-8">
          <Button>View All Links</Button>
        </Link>
      </main>
    </div>
  )
}

export default Home