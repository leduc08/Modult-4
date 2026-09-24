/** Apply the current place quality rules to existing city JSON files. */
import fs from 'node:fs';
import path from 'node:path';
import type { CityPlacesData } from './mergeEngine.ts';
import { prunePlaces } from './placeQuality.ts';

const directory = path.resolve(process.cwd(), 'frontend/src/data/places');
const ids = process.argv.slice(2);
const cityIds = ids.length ? ids : fs.readdirSync(directory)
  .filter(name => name.endsWith('.json'))
  .map(name => name.slice(0, -5));

for (const cityId of cityIds) {
  if (!/^[a-z0-9-]+$/.test(cityId)) throw new Error(`Invalid city ID: ${cityId}`);
  const file = path.join(directory, `${cityId}.json`);
  const data = JSON.parse(fs.readFileSync(file, 'utf8')) as CityPlacesData;
  if (data.cityId !== cityId) throw new Error(`City ID mismatch in ${file}`);
  const result = prunePlaces(data.places);
  if (result.removed) {
    fs.writeFileSync(file, JSON.stringify({ ...data, places: result.places, stats: result.stats }, null, 2), 'utf8');
  }
  console.log(`${cityId}: removed ${result.removed}, kept ${result.stats.total}`);
}
