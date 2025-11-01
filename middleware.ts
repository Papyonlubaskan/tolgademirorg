import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Bakım modu sadece explicit olarak açıldığında aktif
  const maintenanceMode = process.env.MAINTENANCE_MODE === 'true';
  const pathname = request.nextUrl.pathname;

  // Admin paneli ve bakım sayfası hariç tüm sayfaları bakıma yönlendir
  const isAdminPath = pathname.startsWith('/yonetim') || pathname.startsWith('/api/admin') || pathname.startsWith('/api/auth');
  const isMaintenancePath = pathname === '/maintenance';
  const isPublicAsset = pathname.startsWith('/_next') || pathname.startsWith('/public') || pathname.startsWith('/images');
  const isSEOFile = pathname === '/sitemap.xml' || pathname === '/robots.txt' || pathname.startsWith('/google') || pathname === '/favicon.ico';

  if (maintenanceMode && !isAdminPath && !isMaintenancePath && !isPublicAsset && !isSEOFile) {
    return NextResponse.redirect(new URL('/maintenance', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|images|uploads).*)',
  ],
};
