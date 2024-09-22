import { useState } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { prisma } from '../../lib/prisma'; // Updated import

interface AccessPageProps {
  requiresAccessCode: boolean;
  requiresEmail: boolean;
  error?: string; // Added error prop
}

export default function AccessPage({ requiresAccessCode, requiresEmail, error: serverError }: AccessPageProps) {
  const [accessCode, setAccessCode] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState(serverError || '');
  const router = useRouter();
  const { shortCode } = router.query;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`/api/${shortCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode, email }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          setError('No URL returned from server');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Access denied');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-4">Access Protected Link</h1>
        <form onSubmit={handleSubmit}>
          {requiresAccessCode && (
            <div className="mb-4">
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Access Code"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}
          {requiresEmail && (
            <div className="mb-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Access Link
          </button>
        </form>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { shortCode } = context.params as { shortCode: string };

  try {
    const link = await prisma.link.findUnique({
      where: { shortCode },
      select: { accessCode: true, allowedEmails: true, expiresAt: true },
    });

    if (!link) {
      return { notFound: true };
    }

    if (link.expiresAt && new Date() > new Date(link.expiresAt)) {
      return {
        props: {
          error: "This link has expired",
          requiresAccessCode: false,
          requiresEmail: false,
        },
      };
    }

    return {
      props: {
        requiresAccessCode: !!link.accessCode,
        requiresEmail: link.allowedEmails.length > 0,
      },
    };
  } catch (error) {
    console.error('Error fetching link:', error);
    return {
      props: {
        requiresAccessCode: false,
        requiresEmail: false,
        error: 'An error occurred while fetching the link',
      },
    };
  } finally {
    await prisma.$disconnect();
  }
};