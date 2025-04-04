'use client';

import Listings from "../components/site/Listings"
import Hero from "../components/site/Hero"

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-amber-200">
      <Hero />
      <Listings />
    </main>
  )
}