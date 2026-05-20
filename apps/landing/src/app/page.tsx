import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import TrustStrip from '@/components/TrustStrip'
import Features from '@/components/Features'
import HowItWorks from '@/components/HowItWorks'
import Pricing from '@/components/Pricing'
import FinalCTA from '@/components/FinalCTA'
import Footer from '@/components/Footer'

export default function Page() {
  return (
    <main className="min-h-screen bg-truffle-bg text-truffle-text">
      <Nav />
      <Hero />
      <TrustStrip />
      <Features />
      <HowItWorks />
      <Pricing />
      <FinalCTA />
      <Footer />
    </main>
  )
}
