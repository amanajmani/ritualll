import { redirect } from 'next/navigation'

export default function HomePage() {
  // This will be protected by middleware
  // Redirect to home page (which shows the digest)
  redirect('/home')
}