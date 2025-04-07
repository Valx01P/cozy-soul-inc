import { NextResponse } from 'next/server'

export async function GET() {
  const response = {
    message: 'Hello World!'
  }
  return NextResponse.json(response, { status: 200 })
}