// app/api/ticket/route.js

import { NextResponse } from 'next/server';

export async function POST(request: { json: () => PromiseLike<{ subject: any; description: any; }> | { subject: any; description: any; }; }) {
  // Read request body
  const { subject, description } = await request.json();

  // Simulate ticket creation logic (you can replace this with actual logic)
  console.log('Creating support ticket:', subject, description);

  // Respond with a success message
  return NextResponse.json({ message: 'Ticket created successfully' });
}
