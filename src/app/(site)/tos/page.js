'use client'
import Link from 'next/link'
import { FileText, Calendar, AlertCircle } from 'lucide-react'

export default function TermsOfService() {
  // Get current year for copyright
  const currentYear = new Date().getFullYear()
  
  return (
    <div className="bg-white">
      {/* Header */}
      <div className="bg-[var(--primary-red)] py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-white text-lg max-w-3xl mx-auto">
            Please read these terms carefully before using our platform.
          </p>
        </div>
      </div>

      {/* Last Updated Banner */}
      <div className="bg-gray-50 py-4 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center">
          <div className="flex items-center text-gray-600">
            <Calendar size={18} className="mr-2" />
            <span>Last Updated: April 1, 2025</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        {/* Table of Contents */}
        <div className="mb-10 bg-gray-50 p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-4">Table of Contents</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li><a href="#agreement" className="text-[var(--primary-red)] hover:underline">Agreement to Terms</a></li>
            <li><a href="#eligibility" className="text-[var(--primary-red)] hover:underline">Eligibility</a></li>
            <li><a href="#accounts" className="text-[var(--primary-red)] hover:underline">User Accounts</a></li>
            <li><a href="#bookings" className="text-[var(--primary-red)] hover:underline">Bookings and Reservations</a></li>
            <li><a href="#payments" className="text-[var(--primary-red)] hover:underline">Payments and Fees</a></li>
            <li><a href="#cancellations" className="text-[var(--primary-red)] hover:underline">Cancellations and Refunds</a></li>
            <li><a href="#conduct" className="text-[var(--primary-red)] hover:underline">User Conduct</a></li>
            <li><a href="#liability" className="text-[var(--primary-red)] hover:underline">Limitation of Liability</a></li>
            <li><a href="#disputes" className="text-[var(--primary-red)] hover:underline">Dispute Resolution</a></li>
            <li><a href="#modifications" className="text-[var(--primary-red)] hover:underline">Modifications to Terms</a></li>
          </ol>
        </div>

        {/* Agreement to Terms */}
        <div id="agreement" className="mb-12 scroll-mt-20">
          <div className="flex items-center mb-4">
            <FileText className="text-[var(--primary-red)] mr-3" size={24} />
            <h2 className="text-2xl font-bold">1. Agreement to Terms</h2>
          </div>
          <p className="text-gray-700 mb-4">
            These Terms of Service ("Terms") constitute a legally binding agreement between you and CozySoul Inc. ("CozySoul," "we," "our," or "us") governing your access to and use of the CozySoul website, mobile application, and related services (collectively, the "Services").
          </p>
          <p className="text-gray-700 mb-4">
            By accessing or using our Services, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Services.
          </p>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <AlertCircle className="text-yellow-600 mr-3 flex-shrink-0" size={20} />
              <p className="text-yellow-700">
                Please read these Terms carefully, as they contain important information about your legal rights, remedies, and obligations. By using our Services, you acknowledge that you have read and understood these Terms.
              </p>
            </div>
          </div>
        </div>

        {/* Eligibility */}
        <div id="eligibility" className="mb-12 scroll-mt-20">
          <div className="flex items-center mb-4">
            <FileText className="text-[var(--primary-red)] mr-3" size={24} />
            <h2 className="text-2xl font-bold">2. Eligibility</h2>
          </div>
          <p className="text-gray-700 mb-4">
            To use our Services, you must be at least 18 years of age and have the legal capacity to enter into a binding agreement. By using our Services, you represent and warrant that you meet these requirements.
          </p>
          <p className="text-gray-700">
            You may not use our Services if you have previously been suspended or removed from using our Services, or if you are acting on behalf of someone who has been suspended or removed.
          </p>
        </div>

        {/* User Accounts */}
        <div id="accounts" className="mb-12 scroll-mt-20">
          <div className="flex items-center mb-4">
            <FileText className="text-[var(--primary-red)] mr-3" size={24} />
            <h2 className="text-2xl font-bold">3. User Accounts</h2>
          </div>
          <h3 className="text-xl font-semibold mt-6 mb-3">Account Creation</h3>
          <p className="text-gray-700 mb-4">
            To access certain features of our Services, you may need to create an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Account Security</h3>
          <p className="text-gray-700 mb-4">
            You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account or any other breach of security.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Account Termination</h3>
          <p className="text-gray-700">
            We reserve the right to suspend or terminate your account at our sole discretion, without notice, for any reason, including if we believe that you have violated these Terms. You may also request to delete your account at any time.
          </p>
        </div>

        {/* Bookings and Reservations */}
        <div id="bookings" className="mb-12 scroll-mt-20">
          <div className="flex items-center mb-4">
            <FileText className="text-[var(--primary-red)] mr-3" size={24} />
            <h2 className="text-2xl font-bold">4. Bookings and Reservations</h2>
          </div>
          <p className="text-gray-700 mb-4">
            When you make a booking through our Services, you agree to pay all charges associated with your booking, including the rental rate, applicable taxes, and any service fees. You also agree to comply with all rules, restrictions, and requirements associated with the property, including check-in and check-out times, maximum occupancy, and any house rules specified by the property owner or manager.
          </p>
          <p className="text-gray-700">
            Once your booking is confirmed, you will receive a confirmation email with the details of your reservation. Property owners and managers reserve the right to cancel a booking in certain circumstances, as outlined in our Cancellation Policy.
          </p>
        </div>

        {/* Payments and Fees */}
        <div id="payments" className="mb-12 scroll-mt-20">
          <div className="flex items-center mb-4">
            <FileText className="text-[var(--primary-red)] mr-3" size={24} />
            <h2 className="text-2xl font-bold">5. Payments and Fees</h2>
          </div>
          <h3 className="text-xl font-semibold mt-6 mb-3">Payment Processing</h3>
          <p className="text-gray-700 mb-4">
            We use secure third-party payment processors to handle all payment transactions. By making a payment through our Services, you authorize us to charge the payment method you provide for the amount specified at the time of booking, as well as any additional fees that may accrue in connection with your booking.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Service Fees</h3>
          <p className="text-gray-700 mb-4">
            We may charge service fees for the use of our platform. These fees will be clearly displayed before you complete your booking and are non-refundable unless otherwise specified.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Taxes</h3>
          <p className="text-gray-700">
            You are responsible for paying all applicable taxes associated with your booking. We may collect certain taxes on behalf of property owners or as required by law.
          </p>
        </div>

        {/* Cancellations and Refunds */}
        <div id="cancellations" className="mb-12 scroll-mt-20">
          <div className="flex items-center mb-4">
            <FileText className="text-[var(--primary-red)] mr-3" size={24} />
            <h2 className="text-2xl font-bold">6. Cancellations and Refunds</h2>
          </div>
          <p className="text-gray-700 mb-4">
            Cancellation policies vary by property and will be clearly displayed before you complete your booking. By making a booking, you agree to the cancellation policy specified for that property.
          </p>
          <p className="text-gray-700 mb-4">
            If you need to cancel a booking, you may do so through your account or by contacting our customer service team. Refunds, if applicable, will be processed according to the cancellation policy for your booking.
          </p>
          <p className="text-gray-700">
            In certain exceptional circumstances, such as natural disasters or other events beyond our control, we may modify our cancellation and refund policies.
          </p>
        </div>

        {/* User Conduct */}
        <div id="conduct" className="mb-12 scroll-mt-20">
          <div className="flex items-center mb-4">
            <FileText className="text-[var(--primary-red)] mr-3" size={24} />
            <h2 className="text-2xl font-bold">7. User Conduct</h2>
          </div>
          <p className="text-gray-700 mb-4">
            When using our Services, you agree to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4 ml-4">
            <li>Comply with all applicable laws and regulations</li>
            <li>Respect the property and personal boundaries of others</li>
            <li>Provide accurate information when creating a booking</li>
            <li>Use the property only for lawful purposes and as permitted by the property owner or manager</li>
            <li>Not engage in any harmful, fraudulent, deceptive, or abusive activities</li>
            <li>Not use our Services to send spam or other unwanted communications</li>
            <li>Not attempt to interfere with or disrupt our Services or servers</li>
          </ul>
          <p className="text-gray-700">
            Violation of these conduct guidelines may result in the termination of your account, cancellation of your bookings, and/or legal action.
          </p>
        </div>

        {/* Limitation of Liability */}
        <div id="liability" className="mb-12 scroll-mt-20">
          <div className="flex items-center mb-4">
            <FileText className="text-[var(--primary-red)] mr-3" size={24} />
            <h2 className="text-2xl font-bold">8. Limitation of Liability</h2>
          </div>
          <p className="text-gray-700 mb-4">
            To the maximum extent permitted by law, CozySoul, its directors, employees, partners, agents, suppliers, or affiliates, shall not be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4 ml-4">
            <li>Your access to or use of or inability to access or use our Services</li>
            <li>Any conduct or content of any third party on our Services</li>
            <li>Any content obtained from our Services</li>
            <li>Unauthorized access, use or alteration of your transmissions or content</li>
          </ul>
          <p className="text-gray-700">
            This limitation of liability applies whether the alleged liability is based on contract, tort, negligence, strict liability, or any other basis, even if we have been advised of the possibility of such damage.
          </p>
        </div>

        {/* Dispute Resolution */}
        <div id="disputes" className="mb-12 scroll-mt-20">
          <div className="flex items-center mb-4">
            <FileText className="text-[var(--primary-red)] mr-3" size={24} />
            <h2 className="text-2xl font-bold">9. Dispute Resolution</h2>
          </div>
          <h3 className="text-xl font-semibold mt-6 mb-3">Governing Law</h3>
          <p className="text-gray-700 mb-4">
            These Terms shall be governed by and construed in accordance with the laws of the State of Florida, without regard to its conflict of law provisions.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Arbitration</h3>
          <p className="text-gray-700 mb-4">
            Any dispute arising from these Terms or your use of our Services shall be resolved through binding arbitration in Miami, Florida, in accordance with the rules of the American Arbitration Association. The decision of the arbitrator shall be final and binding.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Class Action Waiver</h3>
          <p className="text-gray-700">
            You agree that any dispute resolution proceedings will be conducted only on an individual basis and not in a class, consolidated, or representative action.
          </p>
        </div>

        {/* Modifications to Terms */}
        <div id="modifications" className="mb-12 scroll-mt-20">
          <div className="flex items-center mb-4">
            <FileText className="text-[var(--primary-red)] mr-3" size={24} />
            <h2 className="text-2xl font-bold">10. Modifications to Terms</h2>
          </div>
          <p className="text-gray-700 mb-4">
            We reserve the right to modify these Terms at any time. If we make material changes to these Terms, we will notify you by email or by posting a notice on our website prior to the changes becoming effective.
          </p>
          <p className="text-gray-700 mb-4">
            Your continued use of our Services after any changes to these Terms constitutes your acceptance of such changes. If you do not agree to the modified terms, you should discontinue your use of our Services.
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div className="flex">
              <AlertCircle className="text-blue-600 mr-3 flex-shrink-0" size={20} />
              <p className="text-blue-700">
                We recommend reviewing these Terms periodically to stay informed of any updates.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
          <p className="text-gray-700 mb-4">
            If you have any questions about these Terms, please contact us at:
          </p>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="text-gray-700">
              <strong>CozySoul Inc.</strong><br />
              123 Main Street<br />
              Miami, FL 33101<br />
              <strong>Email:</strong> legal@cozysoul.com<br />
              <strong>Phone:</strong> (305) 555-1234
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 py-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600">
          <p>© {currentYear} CozySoul Inc. All rights reserved.</p>
          <div className="flex justify-center space-x-4 mt-4">
            <Link href="/privacy" className="hover:text-[var(--primary-red)] hover:underline">
              Privacy Policy
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