'use client';

import Listings from "../components/minimal/site/Listings"
import Hero from "../components/minimal/site/Hero"

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col justify-center bg-[#F5F5F5]">
      <Hero />
      <Listings />
    </main>
  )
}