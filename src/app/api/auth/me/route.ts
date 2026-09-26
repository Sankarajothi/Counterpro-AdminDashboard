import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const session = req.cookies.get('counterpro_admin_session');

  if (session && session.value === 'authenticated_admin_session_valid') {
    return NextResponse.json({
      authenticated: true,
      user: {
        email: process.env.ADMIN_USERNAME || 'counterpro@tecstellar.com',
        role: 'Super Admin',
        name: 'CounterPro Admin',
      },
    });
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}
