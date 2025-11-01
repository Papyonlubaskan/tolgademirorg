import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      hero_background: '/hero-background.jpg',
      hero_image: '/hero-profile.jpg',
      hero_title: 'Tolga Demir',
      hero_subtitle: 'Yazar & Hikaye Anlatici',
      sections: []
    }
  });
}