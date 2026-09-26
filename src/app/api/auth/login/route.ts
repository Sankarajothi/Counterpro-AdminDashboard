import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    const expectedUser = process.env.ADMIN_USERNAME || 'counterpro@tecstellar.com';
    const expectedPass = process.env.ADMIN_PASSWORD || 'Counterproadmin@4321';

    const cleanInputUser = (username || '').trim().toLowerCase();
    const cleanExpectedUser = expectedUser.trim().toLowerCase();

    if (cleanInputUser === cleanExpectedUser && password === expectedPass) {
      const response = NextResponse.json({
        success: true,
        user: {
          email: expectedUser,
          role: 'Super Admin',
          name: 'CounterPro Admin',
        },
      });

      // Set auth cookie for 7 days
      response.cookies.set('counterpro_admin_session', 'authenticated_admin_session_valid', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    }

    return NextResponse.json(
      { success: false, message: 'Invalid email or password.' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Authentication service error.' },
      { status: 500 }
    );
  }
}
