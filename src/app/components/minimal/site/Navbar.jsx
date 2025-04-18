'use client';

import Image from 'next/image'
import Link from 'next/link'

export default function Navbar() {

  return (
    <nav className="flex items-center justify-between bg-white p-4 shadow-md">
      <div className="flex items-center">
        <Link href="/">
          <Image src="/svg/red-logo-full.svg" alt="Logo" width={185} height={37} />
        </Link>
      </div>
      <ul className="flex space-x-4">
        <li>
          <Link href="/" className="text-gray-700 hover:text-red-500">Home</Link>
        </li>
        <li>
          <Link href="/about" className="text-gray-700 hover:text-red-500">About</Link>
        </li>
        <li>
          <Link href="/login" className="text-gray-700 hover:text-red-500">Login</Link>
        </li>
        <li>
          <Link href="/signup" className="text-gray-700 hover:text-red-500">Sign Up</Link>
        </li>
        <li>
          <Link href="/contact" className="text-gray-700 hover:text-red-500">Contact</Link>
        </li>
        <li>
          <Link href="#listings" className="text-gray-700 hover:text-red-500">Listings</Link>
        </li>
      </ul>
    </nav>
  )
}