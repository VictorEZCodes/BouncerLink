import type { NextPage } from 'next'
import Head from 'next/head'
import { useState } from 'react'
import { useSession, signIn, signOut } from "next-auth/react"
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"

type Analytics = {
  totalVisits: number;
  uniqueVisitors: number;
  clickLimit: number | null;
  currentClicks: number;
  lastVisited: string | null;
  recentVisits: { timestamp: string; userAgent: string | null; ipAddress: string | null }[];
};

const Home: NextPage = () => {
  const { data: session } = useSession()
  const [url, setUrl] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [shortUrl, setShortUrl] = useState('')
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [accessCode, setAccessCode] = useState('')
  const [allowedEmails, setAllowedEmails] = useState('')
  const [clickLimit, setClickLimit] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const emailList = allowedEmails ? allowedEmails.split(',').map(email => email.trim()) : [];
    const response = await fetch('/api/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        expiresAt: expiresAt || null,
        notificationsEnabled,
        accessCode: accessCode || null,
        allowedEmails: emailList,
        clickLimit: clickLimit ? parseInt(clickLimit) : null,
      }),
      credentials: 'include',
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
      console.log("Received analytics data:", data);
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>BouncerLink</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-5xl font-bold text-center mb-12">
          Welcome to <span className="text-blue-400">BouncerLink</span>
        </h1>

        {session ? (
          <div className="max-w-2xl mx-auto">
            <Card className="bg-gray-800 border-gray-700 text-white">
              <CardHeader>
                <CardTitle>Create a Short Link</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter your URL here"
                    required
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <Input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <Input
                    type="text"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    placeholder="Access Code (optional)"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <Input
                    type="text"
                    value={allowedEmails}
                    onChange={(e) => setAllowedEmails(e.target.value)}
                    placeholder="Allowed Emails (comma-separated, optional)"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <Input
                    type="number"
                    value={clickLimit}
                    onChange={(e) => setClickLimit(e.target.value)}
                    placeholder="Click Limit (optional)"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="notificationsEnabled"
                      checked={notificationsEnabled}
                      onChange={(e) => setNotificationsEnabled(e.target.checked)}
                      className="bg-gray-700 border-gray-600"
                    />
                    <label htmlFor="notificationsEnabled">Enable email notifications</label>
                  </div>
                  <Button type="submit" className="w-full">Shorten URL</Button>
                </form>
              </CardContent>
              <CardFooter className="flex justify-between">
                <p>Signed in as {session.user?.email}</p>
                <Button onClick={() => signOut()} variant="outline">Sign Out</Button>
              </CardFooter>
            </Card>

            {shortUrl && (
              <Card className="mt-8 bg-gray-800 border-gray-700 text-white">
                <CardHeader>
                  <CardTitle>Your Shortened URL</CardTitle>
                </CardHeader>
                <CardContent>
                  <a href={shortUrl} className="text-blue-400 hover:underline">{shortUrl}</a>
                </CardContent>
                <CardFooter>
                  <Button onClick={fetchAnalytics} className="w-full">View Analytics</Button>
                </CardFooter>
              </Card>
            )}

            {analytics && (
              <Card className="mt-8 bg-gray-800 border-gray-700 text-white">
                <CardHeader>
                  <CardTitle>Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p><strong>Total Visits:</strong> {analytics.totalVisits}</p>
                  <p><strong>Unique Visitors:</strong> {analytics.uniqueVisitors}</p>
                  <p><strong>Click Limit:</strong> {analytics.clickLimit || 'No limit'}</p>
                  <p><strong>Current Clicks:</strong> {analytics.currentClicks}</p>
                  <p><strong>Last Visited:</strong> {analytics.lastVisited ? new Date(analytics.lastVisited).toLocaleString() : 'Never'}</p>
                  <h3 className="text-xl font-bold mt-4 mb-2">Recent Visits</h3>
                  <ul className="space-y-2">
                    {analytics.recentVisits.map((visit, index) => (
                      <li key={index} className="text-sm">
                        {new Date(visit.timestamp).toLocaleString()} - {visit.userAgent} ({visit.ipAddress})
                      </li>
                    ))}
                  </ul>
                  <h3 className="text-xl font-bold mt-4 mb-2">Associated/Allowed Emails</h3>
                  {analytics.allowedEmails && analytics.allowedEmails.length > 0 ? (
                    <ul className="list-disc pl-5">
                      {analytics.allowedEmails.map((item, index) => (
                        <li key={index}>
                          {item.email} {item.accessed ? "(Accessed)" : "(Not accessed yet)"}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No associated/allowed emails</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card className="max-w-md mx-auto bg-gray-800 border-gray-700 text-white">
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Please sign in to use BouncerLink</p>
              <Button onClick={() => signIn()} className="w-full">Sign In</Button>
              <Link href="/auth/signup" className="block">
                <Button variant="outline" className="w-full">Sign Up</Button>
              </Link>
            </CardContent>
          </Card>
        )
        }

        <div className="mt-12 text-center">
          <Link href="/links">
            <Button variant="outline">View All Links</Button>
          </Link>
        </div>
      </main >
    </div >
  )
}

export default Home