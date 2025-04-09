// app/api/users/route.js
export async function GET() {
  // Handle GET request
  return Response.json({ users: ['John', 'Jane'] })
}

export async function POST(request) {
  // Parse the request body
  const data = await request.json()
  
  // Process data (e.g., save to database)
  return Response.json({ message: `User ${data.name} created` }, { status: 201 })
}