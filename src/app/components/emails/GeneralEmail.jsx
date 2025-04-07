

export default function GeneralEmail({
  name,
  email,
  phone,
  message
}) {
  return (
    <div>
      <h2>Inquiry Details</h2>
      <p><strong>From:</strong> {name}</p>
      <p><strong>Email:</strong> {email}</p>
      <p><strong>Phone:</strong> {phone}</p>
      <h3>Message:</h3>
      <p>{message}</p>
    </div>
  )
}