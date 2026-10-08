import { syncLibrary } from '#lib/server/ingestion/sync-service.js';

export async function POST() {
    try {
        const result = await syncLibrary();

        return Response.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('VirtualDJ sync failed:', error);

        const message = error instanceof Error
            ? error.message
            : String(error);

        return Response.json({
            success: false,
            error: process.env.NODE_ENV === 'production'
                ? 'Synchronization failed'
                : message
        }, { status: 500 });
    }
}