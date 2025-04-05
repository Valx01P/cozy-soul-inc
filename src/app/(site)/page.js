'use client';

import Listings from "../components/site/Listings"
import Hero from "../components/site/Hero"

export default function Home() {
  return (
    <main className="flex flex-1 flex-col justify-center bg-[#F5F5F5]">
      <Hero />
      <Listings />
    </main>
  )
}