import { NextRequest, NextResponse } from 'next/server';
import { saveAdminCredentials, getAdminCredentials } from '../../../../lib/adminAuthStore';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid admin email address.' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const saved = saveAdminCredentials(email, password);

    if (saved) {
      const response = NextResponse.json({
        success: true,
        message: 'Admin credentials updated successfully.',
        user: {
          email: email.trim().toLowerCase(),
          name: 'Counter365 Super Admin',
          role: 'Super Admin',
        },
      });

      // Update cookie session
      response.cookies.set('counter365_admin_session', 'authenticated_admin_session_valid', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }

    return NextResponse.json(
      { success: false, message: 'Failed to write credentials.' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Reset credentials error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error while resetting credentials.' },
      { status: 500 }
    );
  }
}
