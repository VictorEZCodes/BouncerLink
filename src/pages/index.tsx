import type { NextPage } from 'next'
import Head from 'next/head'
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const Home: NextPage = () => {
  const [url, setUrl] = useState('')
  const [shortUrl, setShortUrl] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const response = await fetch('/api/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    const data = await response.json()
    setShortUrl(data.shortUrl)
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
          <div className="mt-8">
            <p>Your shortened URL:</p>
            <a href={shortUrl} className="text-blue-600 hover:underline">{shortUrl}</a>
          </div>
        )}
      </main>
    </div>
  )
}

export default Home