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
  const [customShortCode, setCustomShortCode] = useState('');

  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'Never';
    const formattedDate = new Date(date);
    return isNaN(formattedDate.getTime()) ? 'Invalid Date' : formattedDate.toLocaleString();
  };

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
        customShortCode: customShortCode || null,
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
                <Button type="submit" className="w-full">Shorten URL</Button>
              </form>
            </CardContent>
          </Card>

          {shortUrl && (
            <Card className={`mt-8 bg-gray-800 border-gray-700 text-white ${!session ? 'relative overflow-hidden' : ''}`}>
              <CardHeader>
                <CardTitle>Your Shortened URL</CardTitle>
              </CardHeader>
              <CardContent>
                <a href={shortUrl} className="text-blue-400 hover:underline">{shortUrl}</a>
              </CardContent>
              {!session && (
                <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex flex-col items-center justify-center">
                  <p className="text-xl mb-4">Sign up to use your shortened URL!</p>
                  <Link href="/auth/signup">
                    <Button>Sign Up</Button>
                  </Link>
                </div>
              )}
            </Card>
          )}

          {session && (
            <>
              <Card className="mt-8 bg-gray-800 border-gray-700 text-white">
                <CardHeader>
                  <CardTitle>Additional Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
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
                    <Input
                      type="text"
                      value={customShortCode}
                      onChange={(e) => setCustomShortCode(e.target.value)}
                      placeholder="Custom short code (optional)"
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
                    <Button type="submit" className="w-full">Update Short Link</Button>
                  </form>
                </CardContent>
              </Card>

              {shortUrl && (
                <Card className="mt-8 bg-gray-800 border-gray-700 text-white">
                  <CardHeader>
                    <CardTitle>Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={fetchAnalytics} className="w-full">View Analytics</Button>
                  </CardContent>
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
                    <p><strong>Last Visited:</strong> {formatDate(analytics.lastVisited)}</p>
                    {/* <p><strong>Expires At:</strong> {formatDate(link.expiresAt)}</p> */}
                    <h3 className="text-xl font-bold mt-4 mb-2">Recent Visits</h3>
                    <ul className="space-y-2">
                      {analytics.recentVisits.map((visit, index) => (
                        <li key={index} className="text-sm">
                          {new Date(visit.timestamp).toLocaleString()} - {visit.userAgent} ({visit.ipAddress})
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          <div className="mt-12 text-center">
            {session ? (
              <>
                <p>Signed in as {session.user?.email}</p>
                <Button onClick={() => signOut()} variant="outline" className="mt-4">Sign Out</Button>
              </>
            ) : (
              <>
                <p>Please sign in to access all features</p>
                <Button onClick={() => signIn()} className="mt-4">Sign In</Button>
              </>
            )}
          </div>

          <div className="mt-12 text-center">
            <Link href="/links">
              <Button variant="outline">View All Links</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Home