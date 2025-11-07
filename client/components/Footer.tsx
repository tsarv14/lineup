'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-black/60 backdrop-blur-xl border-t border-slate-800/50 mt-auto relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">Lineup</h2>
            <span className="text-gray-400 text-sm">Powered by Lineup</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm">
            <Link
              href="/login"
              className="text-gray-400 hover:text-primary-400 transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/terms"
              className="text-gray-400 hover:text-primary-400 transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/contact"
              className="text-gray-400 hover:text-primary-400 transition-colors"
            >
              Contact
            </Link>
            <Link
              href="/refund"
              className="text-gray-400 hover:text-primary-400 transition-colors"
            >
              Refund Policy
            </Link>
            <Link
              href="/responsible-gaming"
              className="text-gray-400 hover:text-primary-400 transition-colors"
            >
              Responsible Gaming
            </Link>
            <Link
              href="/privacy"
              className="text-gray-400 hover:text-primary-400 transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-slate-800/50 text-center">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Lineup. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
