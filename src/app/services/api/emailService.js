
const emailService = {

  /*
    @requires
    {
      "name": "John Doe",
      "email": "example@gmail.com",
      "phone": "1234567890",
      "message": "Hello, I am interested in this property.",
      "propertyid": "2" // Optional, if provided, will fetch property details for the email
    }

    @returns
    SENDS EMAIL TO THE WEBSITE ADMIN OR PROPERTY OWNER

    @throws
    {
      "error": "Some error message"
    }
  */
  sendContactEmail: async (emailData) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/email/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      return data
    } catch (error) {
      console.error('Error sending contact email:', error)
      throw error
    }
  },
  sendVerificationEmail: async (emailData) => {
  },
  sendReservationRequestEmail: async (emailData) => {
  },
  sendReservationApprovedEmail: async (emailData) => {
  },
  sendReservationCancelledEmail: async (emailData) => {
  },
  sendReservationDeclinedEmail: async (emailData) => {
  },
  sendPaymentPlanEmail: async (emailData) => {
  },
  sendPaymentReminderEmail: async (emailData) => {
  },
  sendPaymentSuccessEmail: async (emailData) => {
  },
  sendMissingPaymentEmail: async (emailData) => {
  }
}