import { NextRequest, NextResponse } from 'next/server';
import { searchYouTubeVideos, searchLocationVideos } from '@/lib/api/youtube';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const query = searchParams.get('q');
    const location = searchParams.get('location');

    let videos;
    if (location) {
      videos = await searchLocationVideos(location);
    } else {
      videos = await searchYouTubeVideos(query ?? undefined);
    }

    return NextResponse.json(videos);
  } catch (error) {
    console.error('[api/videos] Error:', error);
    return NextResponse.json([], { status: 500 });
  }
}
