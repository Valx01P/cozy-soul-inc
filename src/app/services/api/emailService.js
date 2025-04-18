
const emailService = {
  /**
   * Sends a contact email based on the provided data
   * @typedef {Object} emailData - The data for the email to be sent.
   * @property {string} name - The name of the person sending the email.
   * @property {string} email - The email address of the person sending the email.
   * @property {string} phone - The phone number of the person sending the email.
   * @property {string} message - The message content of the email.
   * @property {string} propertyid - Optional - The ID of the property related to the inquiry.
   * @param {emailData} emailData - The data for the email to be sent.
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
  }
}