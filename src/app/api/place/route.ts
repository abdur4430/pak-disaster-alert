import { NextRequest, NextResponse } from 'next/server';
import { fetchPlaceInfo } from '@/lib/api/wikipedia';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json({ error: 'Missing name parameter' }, { status: 400 });
    }

    const info = await fetchPlaceInfo(name);

    if (!info) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 });
    }

    return NextResponse.json(info);
  } catch (error) {
    console.error('[api/place] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
