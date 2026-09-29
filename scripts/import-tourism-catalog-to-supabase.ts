import dotenv from 'dotenv';
import { ALL_TIPS, PROVINCES } from '../database/vietnamData.ts';
import type { TravelTip } from '../database/types.ts';

dotenv.config();

type RecordType = 'province' | 'poi' | 'food' | 'festival' | 'souvenir' | 'travel_tip';
interface CatalogRow {
  record_id: string;
  record_type: RecordType;
  province_id: string | null;
  province_name: string;
  name: string;
  category: string | null;
  payload: unknown;
  source: 'vietgo-project';
}

const root = process.cwd();
const batchSize = 100;

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Thiếu ${name} trong file .env.`);
  return value;
}

function tipRow(tip: TravelTip, provinceId: string | null, provinceName: string): CatalogRow {
  return {
    record_id: `travel_tip/${provinceId || 'vietnam'}/${tip.id}`,
    record_type: 'travel_tip', province_id: provinceId, province_name: provinceName,
    name: tip.title, category: tip.category, payload: tip, source: 'vietgo-project',
  };
}

async function main(): Promise<void> {
  const url = requiredEnvironment('SUPABASE_URL').replace(/\/$/, '');
  const key = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!key) throw new Error('Thiếu SUPABASE_SECRET_KEY trong file .env. Chỉ chạy script này ở máy tin cậy.');

  const rows: CatalogRow[] = [];
  for (const province of PROVINCES) {
    const { pois, foods, festivals, souvenirs, tips, ...provinceDetails } = province;
    rows.push({
      record_id: `province/${province.id}`, record_type: 'province', province_id: province.id,
      province_name: province.name, name: province.name, category: province.region,
      payload: provinceDetails, source: 'vietgo-project',
    });
    pois.forEach(item => rows.push({
      record_id: `poi/${item.id}`, record_type: 'poi', province_id: province.id,
      province_name: province.name, name: item.name, category: item.category,
      payload: item, source: 'vietgo-project',
    }));
    foods.forEach(item => rows.push({
      record_id: `food/${item.id}`, record_type: 'food', province_id: province.id,
      province_name: province.name, name: item.dishName, category: item.category,
      payload: item, source: 'vietgo-project',
    }));
    festivals.forEach(item => rows.push({
      record_id: `festival/${item.id}`, record_type: 'festival', province_id: province.id,
      province_name: province.name, name: item.name, category: item.scale,
      payload: item, source: 'vietgo-project',
    }));
    souvenirs.forEach(item => rows.push({
      record_id: `souvenir/${item.id}`, record_type: 'souvenir', province_id: province.id,
      province_name: province.name, name: item.name, category: item.flightRule,
      payload: item, source: 'vietgo-project',
    }));
    tips.forEach(item => rows.push(tipRow(item, province.id, province.name)));
  }
  ALL_TIPS.forEach(item => rows.push(tipRow(item, null, 'Việt Nam')));

  const endpoint = `${url}/rest/v1/tourism_catalog?on_conflict=record_id`;
  for (let offset = 0; offset < rows.length; offset += batchSize) {
    const batch = rows.slice(offset, offset + batchSize);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        apikey: key, Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(batch), signal: AbortSignal.timeout(60000),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      if (/could not find the table|does not exist/i.test(detail)) {
        throw new Error('Chưa có bảng tourism_catalog. Hãy chạy supabase/migrations/202609270002_tourism_catalog.sql trong SQL Editor trước.');
      }
      throw new Error(`Supabase từ chối lô ${Math.floor(offset / batchSize) + 1} (HTTP ${response.status}): ${detail.slice(0, 500)}`);
    }
    console.log(`Đã nhập ${Math.min(offset + batchSize, rows.length)}/${rows.length} bản ghi…`);
  }
  console.log(`Hoàn tất: ${rows.length} bản ghi du lịch từ project VietGo. Chạy lại script sẽ cập nhật dữ liệu theo record_id.`);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : 'Import thất bại.');
  process.exitCode = 1;
});
