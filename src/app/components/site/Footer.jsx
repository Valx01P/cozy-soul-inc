import Image from 'next/image'
import Link from 'next/link'
import { ChevronUp, MapPin, Mail, Phone, Instagram, Facebook, Twitter } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return (
    <footer className="bg-gray-900 text-white relative">
      {/* Top wave divider */}
      <div className="w-full overflow-hidden">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-auto">
          <path fill="#F5F5F5" d="M0 0L48 10C96 20 192 40 288 45C384 50 480 40 576 35C672 30 768 30 864 35C960 40 1056 50 1152 50C1248 50 1344 40 1392 35L1440 30V0H1392C1344 0 1248 0 1152 0C1056 0 960 0 864 0C768 0 672 0 576 0C480 0 384 0 288 0C192 0 96 0 48 0H0Z"/>
        </svg>
      </div>

      {/* Back to top button */}
      <button 
        onClick={scrollToTop}
        className="absolute right-6 -top-6 bg-[var(--primary-red)] hover:bg-[var(--primary-red-hover)] text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:transform hover:scale-110"
        aria-label="Back to top"
      >
        <ChevronUp size={20} />
      </button>

      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand section */}
          <div className="col-span-1">
            <Link href="/" className="inline-block mb-6 transition-transform duration-300 hover:scale-105 ">
              <Image src="/svg/red-logo-full.svg" alt="Logo" width={200} height={40} className="invert" />
            </Link>
            <p className="text-gray-400 mb-6">
              Find your perfect beachfront property for unforgettable Miami experiences.
            </p>
            <div className="flex space-x-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[var(--primary-red)] transition-colors" aria-label="Instagram">
                <Instagram size={24} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[var(--primary-red)] transition-colors" aria-label="Facebook">
                <Facebook size={24} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[var(--primary-red)] transition-colors" aria-label="Twitter">
                <Twitter size={24} />
              </a>
            </div>
          </div>

          {/* Links section */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4 text-[var(--primary-red)]">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors flex items-center">
                  <span className="border-b border-transparent hover:border-[var(--primary-red)]">About Us</span>
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors flex items-center">
                  <span className="border-b border-transparent hover:border-[var(--primary-red)]">Contact</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Support section */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4 text-[var(--primary-red)]">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/tos" className="text-gray-400 hover:text-white transition-colors flex items-center">
                  <span className="border-b border-transparent hover:border-[var(--primary-red)]">Terms of Service</span>
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors flex items-center">
                  <span className="border-b border-transparent hover:border-[var(--primary-red)]">Privacy Policy</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Management section */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4 text-[var(--primary-red)]">Management</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/admin" className="text-gray-400 hover:text-white transition-colors flex items-center">
                  <span className="border-b border-transparent hover:border-[var(--primary-red)]">Admin Portal</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact information */}
        <div className="border-t border-gray-800 mt-8 pt-8 md:pt-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Contact info */}
            <div className="flex flex-col items-center md:items-start mb-6 md:mb-0">
              <h3 className="text-lg font-semibold mb-2 text-[#FF3366]">Contact Us</h3>
              <div className="space-y-2 w-full">
                <p className="text-gray-400 flex items-center justify-center md:justify-start">
                  <MapPin size={16} className="text-[#FF3366] mr-2 flex-shrink-0" />
                  <span>Miami, Florida</span>
                </p>
                <p className="text-gray-400 flex items-center justify-center md:justify-start">
                  <Mail size={16} className="text-[#FF3366] mr-2 flex-shrink-0" />
                  <span>Email: info@miamistays.com</span>
                </p>
                <p className="text-gray-400 flex items-center justify-center md:justify-start">
                  <Phone size={16} className="text-[#FF3366] mr-2 flex-shrink-0" />
                  <span>Phone: (305) 555-1234</span>
                </p>
              </div>
            </div>
            
            {/* Developer credit */}
            <div className="flex flex-col items-center mb-6 md:mb-0">
              <p className="text-gray-400">Website developed by</p>
              <Image 
                src="/svg/brand.svg" 
                alt="Brand Logo" 
                width={120}
                height={60}
                className="invert"
              />
            </div>
            
            {/* Copyright */}
            <div className="flex flex-col items-center md:items-end">
              <p className="text-gray-400">© {currentYear} Cozy Soul Inc. All rights reserved.</p>
              <p className="text-gray-400 mt-1">Owner: Example</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}