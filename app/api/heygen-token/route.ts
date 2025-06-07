import { NextResponse } from 'next/server';

export async function POST() {
  console.log('Fetching HeyGen token');
  console.log(process.env.HEYGEN_API_KEY);
  try {
    const response = await fetch(
      "https://api.heygen.com/v1/streaming.create_token",
      {
        method: "POST",
        headers: { 
          "x-api-key": process.env.HEYGEN_API_KEY || '' 
        },
      }
    );

    const { data } = await response.json();
    return NextResponse.json({ token: data.token });
  } catch (error) {
    console.error('Error fetching HeyGen token:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token' },
      { status: 500 }
    );
  }
} 