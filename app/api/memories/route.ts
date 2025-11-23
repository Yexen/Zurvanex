import { NextRequest, NextResponse } from 'next/server';

// This is a placeholder API route for Hard Memory
// It will be implemented once Supabase environment variables are configured

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    error: 'Hard Memory API not yet configured. Please set up Supabase environment variables.',
    message: 'This endpoint will be available once the database schema is deployed.'
  }, { status: 503 });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    error: 'Hard Memory API not yet configured. Please set up Supabase environment variables.',
    message: 'This endpoint will be available once the database schema is deployed.'
  }, { status: 503 });
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({ 
    error: 'Hard Memory API not yet configured. Please set up Supabase environment variables.',
    message: 'This endpoint will be available once the database schema is deployed.'
  }, { status: 503 });
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({ 
    error: 'Hard Memory API not yet configured. Please set up Supabase environment variables.',
    message: 'This endpoint will be available once the database schema is deployed.'
  }, { status: 503 });
}