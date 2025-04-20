'use client';

export default function Hero() {
  return (
    <section className="bg-white py-20 h-[80vh]">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to CozySoul Inc</h1>
          <p className="text-lg text-gray-600 mb-8">Your dream home awaits in Miami.</p>
          <a href="#listings" className="bg-red-500 text-white px-6 py-3 rounded-full shadow-lg hover:bg-red-600 transition duration-300">
            View Listings
          </a>
        </div>
      </div>
    </section>
  )
}