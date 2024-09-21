import { useState } from 'react'
import { useRouter } from 'next/router'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function SignUp() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    if (response.ok) {
      router.push('/auth/signin')
    } else {
      // Handle error (e.g., show error message)
      console.error('Sign up failed')
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <h1 className="text-4xl font-bold mb-8">Sign Up</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          required
          className="mb-4"
        />
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="mb-4"
        />
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          className="mb-4"
        />
        <Button type="submit" className="w-full">Sign Up</Button>
      </form>
    </div>
  )
}