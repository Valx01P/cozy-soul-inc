'use client';

export default function Footer() {
  return (
    <footer className="bg-white p-4 shadow-md">
      <div className="container mx-auto text-center">
        <p className="text-gray-700">
          &copy; {new Date().getFullYear()} CozySoul Inc. All rights reserved.
        </p>
      </div>
    </footer>
  )
}