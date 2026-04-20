import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type TranslateRequestBody = {
  text?: unknown;
};

type TranslateResponseBody = {
  text?: unknown;
  detail?: unknown;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TranslateRequestBody;
    const text = typeof body.text === 'string' ? body.text.trim() : '';

    if (!text) {
      return NextResponse.json(
        { detail: 'Field "text" is required.' },
        { status: 400 }
      );
    }

    const cookieHeader = request.headers.get('cookie');

    const upstreamResponse = await fetch(`${API_BASE_URL}/editor/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
      cache: 'no-store',
      body: JSON.stringify({ text }),
    });

    const upstreamData = (await upstreamResponse
      .json()
      .catch(() => ({}))) as TranslateResponseBody;

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        {
          detail:
            typeof upstreamData.detail === 'string'
              ? upstreamData.detail
              : 'Translation service returned an error.',
        },
        { status: upstreamResponse.status }
      );
    }

    if (typeof upstreamData.text !== 'string') {
      return NextResponse.json(
        { detail: 'Translation response is missing "text".' },
        { status: 502 }
      );
    }

    return NextResponse.json({ text: upstreamData.text }, { status: 200 });
  } catch (error) {
    console.error('Editor translation failed:', error);

    return NextResponse.json(
      { detail: 'Unable to translate text right now. Please try again.' },
      { status: 500 }
    );
  }
}
