import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const rawId = params?.id ? decodeURIComponent(params.id).trim() : '';
  const cleanId = rawId.replace(/[^a-zA-Z0-9_-]/g, '');

  if (!cleanId) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const storageUrl = `https://tziqjkklqtmjlncoraba.supabase.co/storage/v1/object/public/receipts/${cleanId}.pdf`;

  try {
    const res = await fetch(storageUrl, { cache: 'no-store' });
    if (res.ok) {
      const pdfBuffer = await res.arrayBuffer();
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="receipt-${cleanId}.pdf"`,
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        },
      });
    }
  } catch (err) {
    console.warn('Direct PDF proxy notice, falling back to direct redirect:', err);
  }

  // Fallback: redirect directly to public storage PDF or web bill page
  return NextResponse.redirect(storageUrl, { status: 307 });
}
