import { PROVINCES } from '../database/vietnamData.ts';
import type { FoodSpot, POI } from '../database/types.ts';
import { getTourismSearchTerms, searchTourismCatalogForImage } from './supabaseKnowledge.ts';
import type { AssistantImageAnalysis } from './imageAnalysis.ts';
import type { TourismCatalogResult } from './supabaseKnowledge.ts';

export interface ImageRecommendationResult {
  richData: { pois: POI[]; foods: FoodSpot[] };
  knowledgeSources: Array<{ id: string; title: string; sourceUrl: string }>;
  placeMatch: 'possible_landmark' | 'similar_places' | null;
}

type CatalogSearch = (query: string, type: 'poi' | 'food') => Promise<TourismCatalogResult[]>;

const normalize = (value: string) => value.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
const words = (value: string) => normalize(value).match(/[a-z0-9]+/g) || [];
const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const safeImageUrl = (value: unknown): value is string => typeof value === 'string' && /^https:\/\//i.test(value);

function nameMatchScore(target: string, labels: string[]): number {
  const targetNorm = normalize(target).trim();
  const targetWords = [...new Set(words(targetNorm).filter(word => word.length >= 2))];
  if (targetWords.length < 2 || targetNorm.length < 6) return 0;
  let best = 0;
  for (const label of labels) {
    const labelNorm = normalize(label);
    if (labelNorm.includes(targetNorm) || targetNorm.includes(labelNorm) && labelNorm.length >= 6) return 1;
    const labelWords = new Set(words(labelNorm));
    const overlap = targetWords.filter(word => labelWords.has(word)).length;
    const score = overlap / targetWords.length;
    if (overlap >= 2 && score > best) best = score;
  }
  return best;
}

function clueMatchScore(queryTerms: string[], text: string): number {
  const normalized = normalize(text);
  const terms = [...new Set(queryTerms.map(normalize).filter(term => term.length >= 3))];
  if (!terms.length) return 0;
  const hits = terms.filter(term => normalized.includes(term)).length;
  if (!hits || terms.length > 1 && hits < 2) return 0;
  return hits / terms.length;
}

function toPoi(value: unknown): POI | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string'
    || typeof value.address !== 'string' || !isRecord(value.coordinates)
    || typeof value.coordinates.lat !== 'number' || typeof value.coordinates.lng !== 'number'
    || typeof value.category !== 'string' || typeof value.openingHours !== 'string'
    || typeof value.ticketPrice !== 'number' || typeof value.estimatedTime !== 'string'
    || typeof value.description !== 'string' || !safeImageUrl(value.imageUrl)
    || !Array.isArray(value.tags) || typeof value.localTips !== 'string'
    || typeof value.rating !== 'number' || typeof value.reviewCount !== 'number') return null;
  return value as unknown as POI;
}

function toFoodSpot(value: unknown): FoodSpot | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string'
    || typeof value.dishName !== 'string' || typeof value.category !== 'string'
    || typeof value.address !== 'string' || !isRecord(value.coordinates)
    || typeof value.coordinates.lat !== 'number' || typeof value.coordinates.lng !== 'number'
    || typeof value.priceRange !== 'string' || typeof value.avgPrice !== 'number'
    || typeof value.bestTime !== 'string' || typeof value.isMustTry !== 'boolean'
    || typeof value.isSeasonal !== 'boolean' || typeof value.isLocalFavorite !== 'boolean'
    || typeof value.description !== 'string' || !safeImageUrl(value.imageUrl)
    || typeof value.rating !== 'number' || typeof value.reviewCount !== 'number'
    || typeof value.signatureDish !== 'string') return null;
  return value as unknown as FoodSpot;
}

function payload(row: TourismCatalogResult): Record<string, unknown> | null {
  return isRecord(row.payload) ? row.payload : null;
}

function localFoods(analysis: AssistantImageAnalysis, targets: string[]): FoodSpot[] {
  const province = analysis.provinceGuess
    ? PROVINCES.find(item => normalize(item.name) === normalize(analysis.provinceGuess)) : undefined;
  const catalog = province ? [province] : PROVINCES;
  return catalog.flatMap(item => item.foods.map(food => ({ food, provinceName: item.name })))
    .map(({ food, provinceName }) => ({ food, score: Math.max(0, ...targets.map(target => nameMatchScore(target,
      [food.dishName, food.signatureDish, food.name, `${food.dishName} ${provinceName}`]))) }))
    .filter(item => item.score >= 0.5).sort((a, b) => b.score - a.score || b.food.rating - a.food.rating)
    .slice(0, 3).map(item => item.food);
}

function localPlaces(analysis: AssistantImageAnalysis, searchTerms: string[], exactOnly: boolean): POI[] {
  const catalog = analysis.provinceGuess
    ? PROVINCES.filter(item => normalize(item.name) === normalize(analysis.provinceGuess)) : PROVINCES;
  const rows = catalog.flatMap(province => province.pois.map(poi => ({ poi, provinceName: province.name })));
  return rows.map(({ poi, provinceName }) => {
    const exactScore = analysis.landmarkGuess ? nameMatchScore(analysis.landmarkGuess, [poi.name, ...poi.tags]) : 0;
    const clueScore = clueMatchScore(searchTerms, `${poi.name} ${poi.category} ${poi.description} ${poi.tags.join(' ')} ${provinceName}`);
    return { poi, exactScore, clueScore };
  }).filter(item => exactOnly ? item.exactScore >= 0.5 : item.clueScore >= 0.34)
    .sort((a, b) => b.exactScore - a.exactScore || b.clueScore - a.clueScore || b.poi.rating - a.poi.rating)
    .slice(0, exactOnly ? 2 : 3).map(item => item.poi);
}

export async function getImageRecommendations(
  analysis: AssistantImageAnalysis,
  searchCatalog: CatalogSearch = searchTourismCatalogForImage,
): Promise<ImageRecommendationResult> {
  const empty: ImageRecommendationResult = { richData: { pois: [], foods: [] }, knowledgeSources: [], placeMatch: null };
  if (analysis.category === 'food' && analysis.dishName && analysis.dishConfidence !== 'low') {
    const targets = [...new Set([analysis.dishName, ...analysis.foodSearchTerms].map(term => term.trim()).filter(term => term.length >= 6))].slice(0, 5);
    const query = [...targets, analysis.provinceGuess].filter(Boolean).join(' ');
    const rows = await searchCatalog(query, 'food').catch(() => []);
    const matched = rows.filter(row => row.record_type === 'food').map(row => {
      const item = payload(row);
      const food = toFoodSpot(item);
      const score = food ? Math.max(0, ...targets.map(target => nameMatchScore(target,
        [row.name, food.dishName, food.signatureDish, food.name]))) : 0;
      return { row, food, score };
    }).filter(item => item.food && item.score >= 0.5).sort((a, b) => b.score - a.score).slice(0, 3);
    const foods = matched.length ? matched.map(item => item.food!) : localFoods(analysis, targets);
    return {
      ...empty,
      richData: { pois: [], foods },
      knowledgeSources: matched.map(({ row }) => ({ id: row.record_id, title: `${row.name} — ${row.province_name}`, sourceUrl: '' })),
    };
  }

  if (analysis.category === 'landscape') {
    const canNamePlace = !!analysis.landmarkGuess && analysis.locationConfidence !== 'low';
    const searchTerms = [...new Set([
      ...(canNamePlace ? [analysis.landmarkGuess, analysis.provinceGuess] : []),
      ...analysis.placeSearchTerms, ...analysis.visualClues,
    ].map(term => term.trim()).filter(Boolean))].slice(0, 8);
    if (!searchTerms.length) return empty;
    const rows = await searchCatalog(searchTerms.join(' '), 'poi').catch(() => []);
    const matches = rows.filter(row => row.record_type === 'poi').map(row => {
      const item = payload(row);
      const poi = toPoi(item);
      const exactScore = poi && canNamePlace ? nameMatchScore(analysis.landmarkGuess, [row.name, poi.name, ...poi.tags]) : 0;
      const clueScore = poi ? clueMatchScore(analysis.placeSearchTerms, `${row.name} ${row.category || ''} ${JSON.stringify(item)}`) : 0;
      return { row, poi, exactScore, clueScore };
    }).filter(item => item.poi && (item.exactScore >= 0.5 || item.clueScore >= 0.34));
    const exact = canNamePlace ? matches.filter(item => item.exactScore >= 0.5).slice(0, 2) : [];
    const similar = exact.length ? [] : matches.filter(item => item.clueScore >= 0.34).slice(0, 3);
    let chosen = exact.length ? exact : similar;
    if (!chosen.length) {
      const localExact = canNamePlace ? localPlaces(analysis, analysis.placeSearchTerms, true) : [];
      const localSimilar = localExact.length ? [] : localPlaces(analysis, analysis.placeSearchTerms, false);
      const pois = localExact.length ? localExact : localSimilar;
      return { ...empty, richData: { pois, foods: [] }, placeMatch: localExact.length ? 'possible_landmark' : localSimilar.length ? 'similar_places' : null };
    }
    return {
      ...empty,
      richData: { pois: chosen.map(item => item.poi!), foods: [] },
      knowledgeSources: chosen.map(({ row }) => ({ id: row.record_id, title: `${row.name} — ${row.province_name}`, sourceUrl: '' })),
      placeMatch: exact.length ? 'possible_landmark' : 'similar_places',
    };
  }

  return empty;
}
