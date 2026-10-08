import { getOverview } from '#lib/server/analytics/overview.js';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
    return getOverview();
};