'use client'
import Link from 'next/link'
import { Shield, Calendar, Mail, Info } from 'lucide-react'

export default function Privacy() {
  // Get current year for copyright
  const currentYear = new Date().getFullYear()
  
  return (
    <div className="bg-white">
      {/* Header */}
      <div className="bg-[var(--primary-red)] py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-white text-lg max-w-3xl mx-auto">
            Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.
          </p>
        </div>
      </div>

      {/* Last Updated Banner */}
      <div className="bg-gray-50 py-4 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center md:justify-between">
          <div className="flex items-center text-gray-600">
            <Calendar size={18} className="mr-2" />
            <span>Last Updated: April 1, 2025</span>
          </div>
          <div className="hidden md:flex items-center text-gray-600">
            <Info size={18} className="mr-2" />
            <span>Effective Date: April 15, 2025</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        {/* Introduction */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Introduction</h2>
          <p className="text-gray-700 mb-4">
            CozySoul Inc. ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, use our mobile application, or interact with our services.
          </p>
          <p className="text-gray-700 mb-4">
            We reserve the right to make changes to this Privacy Policy at any time and for any reason. We will alert you about any changes by updating the "Last Updated" date of this Privacy Policy. You are encouraged to periodically review this Privacy Policy to stay informed of updates.
          </p>
          <p className="text-gray-700">
            By using our services, you are consenting to the collection and use of your personal information as described in this Privacy Policy. If you do not agree with the terms of this Privacy Policy, please do not access the website or use our services.
          </p>
        </div>

        {/* Information We Collect */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Information We Collect</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Personal Data</h3>
          <p className="text-gray-700 mb-4">
            We may collect personal information that you voluntarily provide to us when you:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4 ml-4">
            <li>Register for an account</li>
            <li>Sign up for our newsletter</li>
            <li>Request information about our properties</li>
            <li>Contact our customer service team</li>
            <li>Complete a booking or transaction</li>
            <li>Participate in promotions or surveys</li>
          </ul>
          <p className="text-gray-700 mb-4">
            The personal information we collect may include:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4 ml-4">
            <li>Name and contact information (email address, phone number, mailing address)</li>
            <li>Payment information</li>
            <li>Date of birth or age</li>
            <li>Preferences and interests</li>
            <li>Communication history with us</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">Automatically Collected Data</h3>
          <p className="text-gray-700 mb-4">
            When you access our website or use our services, we may automatically collect certain information about your device and usage, including:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4 ml-4">
            <li>Device type, operating system, and browser information</li>
            <li>IP address and geographic location</li>
            <li>Pages visited and time spent on our website</li>
            <li>Referring websites or sources</li>
            <li>Interactions with our content and advertisements</li>
          </ul>
          <p className="text-gray-700">
            We collect this information using cookies, web beacons, and similar technologies. Please see our Cookie Policy for more information.
          </p>
        </div>

        {/* How We Use Your Information */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">How We Use Your Information</h2>
          <p className="text-gray-700 mb-4">
            We may use your information for the following purposes:
          </p>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">To Provide and Improve Our Services</h3>
              <p className="text-gray-700">
                We use your information to process bookings, respond to inquiries, facilitate payments, and provide customer support. We also analyze usage patterns to improve our website, services, and user experience.
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">For Communication</h3>
              <p className="text-gray-700">
                We may use your contact information to send you booking confirmations, updates, administrative messages, and, with your consent, marketing communications about our properties and special offers.
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">For Legal and Security Purposes</h3>
              <p className="text-gray-700">
                We may use your information to verify your identity, protect against fraudulent or unauthorized transactions, and comply with legal obligations.
              </p>
            </div>
          </div>
        </div>

        {/* Sharing Your Information */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Sharing Your Information</h2>
          <p className="text-gray-700 mb-4">
            We may share your information with third parties in the following circumstances:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4 ml-4">
            <li>With property owners and service providers to facilitate your booking</li>
            <li>With third-party service providers who perform services on our behalf</li>
            <li>With business partners for joint marketing efforts (with your consent)</li>
            <li>In connection with a business transaction (e.g., merger or acquisition)</li>
            <li>When required by law or to protect our legal rights</li>
          </ul>
          <p className="text-gray-700">
            We do not sell your personal information to third parties for their marketing purposes without your explicit consent.
          </p>
        </div>

        {/* Your Rights and Choices */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Your Rights and Choices</h2>
          <p className="text-gray-700 mb-4">
            Depending on your location, you may have certain rights regarding your personal information, including:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4 ml-4">
            <li>The right to access the personal information we hold about you</li>
            <li>The right to correct inaccurate or incomplete information</li>
            <li>The right to request that we delete your personal information</li>
            <li>The right to restrict or object to the processing of your information</li>
            <li>The right to data portability</li>
            <li>The right to withdraw consent (where applicable)</li>
          </ul>
          <p className="text-gray-700 mb-4">
            To exercise these rights, please contact us using the information provided in the "Contact Us" section below.
          </p>
          <p className="text-gray-700">
            You can also control certain data collection through your browser settings, device settings, and by managing your subscription preferences in our communications.
          </p>
        </div>

        {/* Security */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Security</h2>
          <p className="text-gray-700 mb-4">
            We have implemented appropriate technical and organizational measures to protect your personal information from unauthorized access, use, or disclosure. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
          </p>
          <p className="text-gray-700">
            We regularly review our security practices to ensure they remain effective and up-to-date with industry standards.
          </p>
        </div>

        {/* Children's Privacy */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Children's Privacy</h2>
          <p className="text-gray-700">
            Our services are not intended for children under the age of 16, and we do not knowingly collect personal information from children under 16. If you are a parent or guardian and believe that your child has provided us with personal information, please contact us immediately, and we will take steps to remove that information from our systems.
          </p>
        </div>

        {/* Contact Us */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
          <p className="text-gray-700 mb-6">
            If you have any questions or concerns about this Privacy Policy or our data practices, please contact us:
          </p>
          
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex items-start mb-4">
              <Mail size={20} className="text-[var(--primary-red)] mt-1 mr-3" />
              <div>
                <h3 className="font-semibold">Email</h3>
                <p className="text-gray-700">privacy@cozysoul.com</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Shield size={20} className="text-[var(--primary-red)] mt-1 mr-3" />
              <div>
                <h3 className="font-semibold">Data Protection Officer</h3>
                <p className="text-gray-700">CozySoul Inc.</p>
                <p className="text-gray-700">123 Main Street, Miami, FL 33101</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 py-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600">
          <p>© {currentYear} CozySoul Inc. All rights reserved.</p>
          <div className="flex justify-center space-x-4 mt-4">
            <Link href="/tos" className="hover:text-[var(--primary-red)] hover:underline">
              Terms of Service
            </Link>
            <Link href="/contact" className="hover:text-[var(--primary-red)] hover:underline">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}