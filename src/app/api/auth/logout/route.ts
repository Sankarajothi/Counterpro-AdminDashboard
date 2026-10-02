import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.delete('counter365_admin_session');
  response.cookies.delete('counterpro_admin_session');
  return response;
}
