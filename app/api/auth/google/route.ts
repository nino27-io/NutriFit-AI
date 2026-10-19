import { NextResponse } from 'next/server';

interface GoogleTokenInfoResponse {
  iss?: string;
  sub?: string;
  aud?: string;
  email?: string;
  email_verified?: string;
  name?: string;
  picture?: string;
  given_name?: string;
  error_description?: string;
}

export async function POST(request: Request) {
  try {
    const { credential } = (await request.json()) as { credential?: string };

    if (!credential) {
      return NextResponse.json(
        { error: 'Token kredensial Google tidak ditemukan.' },
        { status: 400 }
      );
    }

    // Verifikasi ID Token langsung ke server otorisasi Google
    const verifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(
        credential
      )}`,
      { cache: 'no-store' }
    );

    const payload = (await verifyRes.json()) as GoogleTokenInfoResponse;

    if (!verifyRes.ok || !payload.email) {
      return NextResponse.json(
        {
          error:
            payload.error_description ||
            'Verifikasi akun Google gagal atau token kedaluwarsa.',
        },
        { status: 401 }
      );
    }

    const expectedClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
    if (
      expectedClientId &&
      !expectedClientId.includes('MASUKKAN_GOOGLE_CLIENT_ID') &&
      payload.aud !== expectedClientId
    ) {
      return NextResponse.json(
        { error: 'Client ID Google tidak cocok dengan aplikasi ini.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        googleId: payload.sub || '',
        email: payload.email.toLowerCase(),
        name: payload.name || payload.given_name || payload.email.split('@')[0],
        picture: payload.picture || '',
      },
    });
  } catch (error: unknown) {
    console.error('Google Auth Verification Error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memverifikasi akun Google.' },
      { status: 500 }
    );
  }
}