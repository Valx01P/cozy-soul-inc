

// dynamic digit code for email verification
function generateRandomCode(length = 6) {
  const code = Math.floor(Math.pow(10, length - 1) + Math.random() * (Math.pow(10, length) - Math.pow(10, length - 1)))
  return code.toString()
}

const requestCounts = {}

function isRateLimited (ip) {
  const requestLimit = 3 // Limiting to 2 requests per 10 minutes
  const interval = 10 * 60 * 1000 // 10 minutes

  // Initialize request count if not already present
  requestCounts[ip] = requestCounts[ip] || []

  // Remove requests older than 1 minute
  requestCounts[ip] = requestCounts[ip].filter(({ timestamp }) => timestamp > Date.now() - interval)

  // Check if request count exceeds limit
  if (requestCounts[ip].length >= requestLimit) {
    return true // Rate limit exceeded
  }

  // Increment request count
  requestCounts[ip].push({ timestamp: Date.now() })
  return false // Rate limit not exceeded
}

export { isRateLimited, generateRandomCode }