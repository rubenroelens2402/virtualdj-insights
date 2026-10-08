
import { syncHistory } from '#lib/server/ingestion/sync-service.js';
import { matchHistoryToLibrary } from '#lib/server/ingestion/track-matcher.ts';

export async function POST() {
    try {
        const result = await syncHistory();
        const matching = await matchHistoryToLibrary();
        
        return Response.json({
            success: true,
            ...result,
            ...matching
        });
    } catch (error) {
        console.error('History sync failed:', error);

        return Response.json({
            success: false,
            error: process.env.NODE_ENV === 'production'
                ? 'History synchronization failed'
                : error instanceof Error
                    ? error.message
                    : String(error)
        }, { status: 500 });
    }
}
