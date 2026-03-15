import { NextRequest, NextResponse } from 'next/server';
import { selectActiveProfileByName } from '@/app/actions/profile';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const handle = searchParams.get('handle');

    if (!handle) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    const res = await selectActiveProfileByName(handle);
    
    if (res.success) {
        // Force a fresh redirect to clear any stale state
        const response = NextResponse.redirect(new URL('/', request.url));
        return response;
    }

    return NextResponse.redirect(new URL('/', request.url));
}
