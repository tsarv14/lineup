'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function ResponsibleGamingPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-white mb-8">Responsible Gaming</h1>
        <div className="prose prose-invert max-w-none">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 space-y-6 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Our Commitment</h2>
              <p>
                Lineup is committed to promoting responsible gaming and ensuring that our platform is used in a safe and responsible manner. Sports picks and predictions are for entertainment and informational purposes only.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Gambling Responsibly</h2>
              <p>
                Never gamble more than you can afford to lose. Set limits for yourself and stick to them. Remember that all picks are opinions and there are no guaranteed wins. Only spend what you can afford to lose.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Warning Signs</h2>
              <p>
                If you find yourself gambling more than you can afford, chasing losses, or gambling affecting your relationships or work, please seek help immediately. Problem gambling can have serious consequences.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Getting Help</h2>
              <p>
                If you need help with problem gambling, please contact:
                <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                  <li>National Council on Problem Gambling: 1-800-522-4700</li>
                  <li>Gamblers Anonymous: www.gamblersanonymous.org</li>
                  <li>National Problem Gambling Helpline: www.ncpgambling.org</li>
                </ul>
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Age Restrictions</h2>
              <p>
                You must be 18 years or older (21+ in some jurisdictions) to use Lineup. We reserve the right to verify age and refuse service to anyone under the legal age. We may require age verification documents.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Self-Exclusion</h2>
              <p>
                If you feel you need to take a break from using our platform, you can contact us to temporarily or permanently suspend your account. We support responsible gaming practices.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
