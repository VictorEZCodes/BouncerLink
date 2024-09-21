import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    })
    if (result?.error) {
      // Handle error (e.g., show error message)
      console.error(result.error)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <h1 className="text-4xl font-bold mb-8">Sign In</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-md">
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
        <Button type="submit" className="w-full">Sign In</Button>
      </form>
    </div>
  )
}