import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// WordPress ve diğer CMS tarama denemelerini engelle
const blockedPaths = [
  '/wp-admin',
  '/wp-login',
  '/wp-content',
  '/wp-includes',
  '/wordpress',
  '/xmlrpc.php',
  '/wp-config.php',
  '/.env',
  '/phpmyadmin',
  '/admin',
  '/.git',
  '/backup',
  '/setup.php',
  '/install.php',
  '/.well-known/security.txt'
];

// Şüpheli bot user-agent'ları
const suspiciousAgents = [
  'sqlmap',
  'nikto',
  'nmap',
  'masscan',
  'metasploit',
  'burpsuite',
  'havij',
  'acunetix'
];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';

  // WordPress ve CMS taramalarını engelle
  const isBlockedPath = blockedPaths.some(blocked => 
    pathname.toLowerCase().includes(blocked.toLowerCase())
  );

  if (isBlockedPath) {
    console.warn(`🚫 Blocked malicious scan attempt: ${pathname} from ${request.headers.get('x-forwarded-for') || 'unknown'}`);
    return new NextResponse('Not Found', { status: 404 });
  }

  // Şüpheli botları engelle
  const isSuspiciousBot = suspiciousAgents.some(agent => 
    userAgent.includes(agent)
  );

  if (isSuspiciousBot) {
    console.warn(`🚫 Blocked suspicious bot: ${userAgent} from ${request.headers.get('x-forwarded-for') || 'unknown'}`);
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Bakım modu sadece explicit olarak açıldığında aktif
  const maintenanceMode = process.env.MAINTENANCE_MODE === 'true';

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
