// app/api/users/[id]/route.js
export async function GET(request, { params }) {
  // Await params before destructuring
  const { id } = await params
  
  return Response.json({ id, name: `User ${id}` })
}