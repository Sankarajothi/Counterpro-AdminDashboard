import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const session365 = req.cookies.get('counter365_admin_session');
  const sessionPro = req.cookies.get('counterpro_admin_session');
  const session = session365 || sessionPro;

  if (session && session.value === 'authenticated_admin_session_valid') {
    return NextResponse.json({
      authenticated: true,
      user: {
        email: process.env.ADMIN_USERNAME || 'counter365@tecstellar.com',
        role: 'Super Admin',
        name: 'Counter365 Admin',
      },
    });
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}
