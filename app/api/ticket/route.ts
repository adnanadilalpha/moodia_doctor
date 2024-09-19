import { NextResponse } from 'next/server';
import { db } from '@/app/firebase'; // Adjust the path as needed
import { collection, addDoc } from 'firebase/firestore';

// Handle the POST request to submit a ticket
export async function POST(request: Request) {
  try {
    // Parse the request body as JSON
    const { subject, description } = await request.json();

    // Add the ticket to Firestore
    const docRef = await addDoc(collection(db, 'tickets'), {
      subject,
      description,
      createdAt: new Date().toISOString(),
    });

    // Respond with a success message
    return NextResponse.json({ message: 'Ticket created successfully', id: docRef.id }, { status: 200 });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json({ message: 'Failed to create ticket' }, { status: 500 });
  }
}
