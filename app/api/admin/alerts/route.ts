import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: []
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch alerts'
    }, { status: 500 });
  }
}