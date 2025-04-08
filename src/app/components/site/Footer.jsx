import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

export default function Footer() {
  const [email, setEmail] = useState('')
  
  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle newsletter submission logic here
    console.log('Subscribed with:', email)
    setEmail('')
    // Add actual submission logic or API call
  }

  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white">
      {/* Top wave divider */}
      <div className="w-full">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path fill="#F5F5F5" d="M0 0L48 10C96 20 192 40 288 45C384 50 480 40 576 35C672 30 768 30 864 35C960 40 1056 50 1152 50C1248 50 1344 40 1392 35L1440 30V0H1392C1344 0 1248 0 1152 0C1056 0 960 0 864 0C768 0 672 0 576 0C480 0 384 0 288 0C192 0 96 0 48 0H0Z"/>
        </svg>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand section */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="inline-block mb-6 transition-transform duration-300 hover:scale-105">
              <Image src="/svg/red-logo-full.svg" alt="Logo" width={200} height={40} className="invert" />
            </Link>
            <p className="text-gray-400 mb-6">
              Find your perfect beachfront property for unforgettable Miami experiences.
            </p>
            <div className="flex space-x-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[var(--primary-red)] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[var(--primary-red)] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                </svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[var(--primary-red)] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Links section */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-6 text-[var(--primary-red)]">Company</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link>
              </li>
              {/* <li>
                <Link href="/careers" className="text-gray-400 hover:text-white transition-colors">Careers</Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link>
              </li> */}
            </ul>
          </div>

          {/* Support section */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-6 text-[var(--primary-red)]">Support</h3>
            <ul className="space-y-4">
              {/* <li>
                <Link href="/help" className="text-gray-400 hover:text-white transition-colors">Help Center</Link>
              </li> */}
              {/* <li>
                <Link href="/faqs" className="text-gray-400 hover:text-white transition-colors">FAQs</Link>
              </li> */}
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link>
              </li>
            </ul>
          </div>

          {/* Owner section */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-6 text-[var(--primary-red)]">Management</h3>
            <ul className="space-y-4">
              {/* <li>
                <Link href="/help" className="text-gray-400 hover:text-white transition-colors">Help Center</Link>
              </li> */}
              {/* <li>
                <Link href="/faqs" className="text-gray-400 hover:text-white transition-colors">FAQs</Link>
              </li> */}
              <li>
                <Link href="/admin" className="text-gray-400 hover:text-white transition-colors">Admin Portal</Link>
              </li>
            </ul>
          </div>

          {/* Newsletter section */}
          {/* <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-6 text-[var(--primary-red)]">Newsletter</h3>
            <p className="text-gray-400 mb-4">Stay updated with our latest properties and offers</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="w-full px-4 py-3 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-red)]"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full px-6 py-3 bg-[var(--primary-red)] text-white font-medium rounded-lg transition duration-300 hover:bg-[var(--primary-red-hover)]"
              >
                Subscribe
              </button>
            </form>
          </div> */}
        </div>

        {/* Contact information */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h3 className="text-lg font-semibold mb-2 text-[var(--primary-red)]">Contact Us</h3>
              <p className="text-gray-400">Miami, Florida</p>
              <p className="text-gray-400">Email: info@miamistays.com</p>
              <p className="text-gray-400">Phone: (305) 555-1234</p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-gray-400">© {currentYear} Miami Stays. All rights reserved.</p>
              <p className="text-gray-400 mt-1">Owner: Pablo Valdes</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}