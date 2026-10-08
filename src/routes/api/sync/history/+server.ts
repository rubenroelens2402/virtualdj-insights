
import { syncHistory } from '#lib/server/ingestion/sync-service.js';

export async function POST() {
    try {
        const result = await syncHistory();

        return Response.json({
            success: true,
            ...result
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
