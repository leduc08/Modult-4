import type { MergeStats, MergedPlace } from './mergeEngine.ts';

const BUSINESS_CATEGORIES = new Set(['food', 'cafe', 'shopping', 'stay']);
const CLOSED_NAME = /\((?:permanently )?closed\)|đã đóng cửa|ngừng hoạt động|đóng cửa|closed down/i;

function hasValue(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

/** Remove businesses that have no way to identify or contact the location. */
export function shouldKeepPlace(place: MergedPlace): boolean {
  if (CLOSED_NAME.test(place.name)) return false;
  if (!BUSINESS_CATEGORIES.has(place.categoryGroup)) return true;
  return hasValue(place.address) || hasValue(place.phone) || hasValue(place.website);
}

/** Exclude OSM features explicitly marked as inactive before merging. */
export function isInactiveOSM(tags: Record<string, string>): boolean {
  return ['disused', 'abandoned', 'demolished', 'removed', 'razed', 'destroyed']
    .some(key => ['yes', 'true', '1'].includes(tags[key]?.toLowerCase())) ||
    tags.shop === 'vacant';
}

export function summarizePlaces(places: MergedPlace[]): MergeStats {
  return {
    total: places.length,
    fromFoursquare: places.filter(place => place.dataSource === 'foursquare').length,
    fromOSM: places.filter(place => place.dataSource === 'osm').length,
    merged: places.filter(place => place.dataSource === 'merged').length,
    needsReview: places.filter(place => place.needsReview).length,
  };
}

export function prunePlaces(places: MergedPlace[]): { places: MergedPlace[]; stats: MergeStats; removed: number } {
  const kept = places.filter(shouldKeepPlace);
  return { places: kept, stats: summarizePlaces(kept), removed: places.length - kept.length };
}
