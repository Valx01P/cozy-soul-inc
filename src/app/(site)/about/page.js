'use client'
import Image from 'next/image'
import { Home, Users, Star, ThumbsUp } from 'lucide-react'

export default function About() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
        <Image
          src="https://placehold.co/1920x1080/png?text=Beautiful+Property+View"
          alt="Beautiful property view"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">About CozySoul</h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto">
              Discover our story and the passion behind our premium properties
            </p>
          </div>
        </div>
      </div>

      {/* Our Story Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="order-2 md:order-1">
            <h2 className="text-3xl font-bold mb-6">Our Story</h2>
            <p className="text-gray-700 mb-4">
              Founded in 2015, CozySoul began with a simple mission: to connect travelers with unique, comfortable homes that feel like a true escape. What started as a small collection of handpicked properties in Miami has grown into a curated portfolio of exceptional homes across Florida.
            </p>
            <p className="text-gray-700 mb-4">
              Our founders, John and Maria Rodriguez, combined their backgrounds in hospitality and real estate to create a rental experience that prioritizes both quality and authenticity. Each property in our collection is personally visited and vetted to ensure it meets our high standards.
            </p>
            <p className="text-gray-700">
              Today, we continue to grow while maintaining our commitment to personalized service and unforgettable stays. We believe that where you stay is as important as where you go, and we're dedicated to making every CozySoul experience special.
            </p>
          </div>
          <div className="order-1 md:order-2 relative h-80 md:h-96 rounded-xl overflow-hidden">
            <Image
              src="https://placehold.co/800x600/png?text=Our+Story"
              alt="Our founding team"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-gray-50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Our Values</h2>
            <p className="text-gray-700 max-w-3xl mx-auto">
              These core principles guide everything we do, from selecting properties to supporting our guests.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="bg-[var(--primary-red)] w-12 h-12 rounded-full flex items-center justify-center text-white mb-6">
                <Home size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Quality</h3>
              <p className="text-gray-700">
                We meticulously curate our properties, ensuring each one meets the highest standards of comfort, cleanliness, and style.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="bg-[var(--primary-red)] w-12 h-12 rounded-full flex items-center justify-center text-white mb-6">
                <Users size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Community</h3>
              <p className="text-gray-700">
                We foster connections between our guests and local communities, promoting sustainable tourism that benefits everyone.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="bg-[var(--primary-red)] w-12 h-12 rounded-full flex items-center justify-center text-white mb-6">
                <Star size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Excellence</h3>
              <p className="text-gray-700">
                We strive for excellence in every interaction, from seamless bookings to responsive support throughout your stay.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="bg-[var(--primary-red)] w-12 h-12 rounded-full flex items-center justify-center text-white mb-6">
                <ThumbsUp size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Trust</h3>
              <p className="text-gray-700">
                We build trust through transparency, reliability, and by consistently exceeding our guests' expectations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Meet Our Team</h2>
          <p className="text-gray-700 max-w-3xl mx-auto">
            The passionate people behind CozySoul who work tirelessly to create exceptional experiences for our guests.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Team Member 1 */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="relative h-80">
              <Image
                src="https://placehold.co/400x500/png?text=John+Rodriguez"
                alt="John Rodriguez"
                fill
                className="object-cover"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-1">John Rodriguez</h3>
              <p className="text-[var(--primary-red)] font-medium mb-4">Co-Founder & CEO</p>
              <p className="text-gray-700">
                With over 15 years in luxury hospitality, John ensures every CozySoul property delivers an exceptional experience.
              </p>
            </div>
          </div>

          {/* Team Member 2 */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="relative h-80">
              <Image
                src="https://placehold.co/400x500/png?text=Maria+Rodriguez"
                alt="Maria Rodriguez"
                fill
                className="object-cover"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-1">Maria Rodriguez</h3>
              <p className="text-[var(--primary-red)] font-medium mb-4">Co-Founder & Creative Director</p>
              <p className="text-gray-700">
                Maria brings her background in interior design to curate properties that are both beautiful and functional.
              </p>
            </div>
          </div>

          {/* Team Member 3 */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="relative h-80">
              <Image
                src="https://placehold.co/400x500/png?text=Alex+Chen"
                alt="Alex Chen"
                fill
                className="object-cover"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-1">Alex Chen</h3>
              <p className="text-[var(--primary-red)] font-medium mb-4">Head of Customer Experience</p>
              <p className="text-gray-700">
                Alex and his team ensure every guest receives personalized attention and support throughout their stay.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-[var(--primary-red)] py-16">
        <div className="max-w-5xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-bold mb-6">Experience the CozySoul Difference</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Browse our carefully curated collection of premium properties and find your perfect getaway today.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-white text-[var(--primary-red)] hover:bg-gray-100 transition-colors px-8 py-3 rounded-full font-medium"
          >
            View Properties
          </button>
        </div>
      </div>
    </div>
  )
}