'use client'

import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default function ExampleCreatorPlansPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Navbar />
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Example Creator's Subscription Plans</h1>
        <p className="text-gray-400 text-lg mb-8">
          This is where subscription plans would be displayed.
        </p>
        <div className="mt-8">
          <Link href="/creator/example" className="text-primary-400 hover:text-primary-300">
            ← Back to Example Creator's Storefront
          </Link>
        </div>
      </div>
    </div>
  )
}

