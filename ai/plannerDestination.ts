const normalize = (value: string) => value.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, ' ').trim();

export const AI_SUPPORTED_CITIES: Record<string, string> = {
  'ha-noi': 'Hà Nội', 'da-nang': 'Đà Nẵng', 'hoi-an': 'Hội An',
  hue: 'Huế', 'ninh-binh': 'Ninh Bình', 'da-lat': 'Đà Lạt',
  'sa-pa': 'Sa Pa', 'phu-quoc': 'Phú Quốc', 'nha-trang': 'Nha Trang', 'tp-hcm': 'TP. Hồ Chí Minh',
};

/** Translate the assistant's legacy province labels to the planner's city IDs. */
export function resolveAIPlannerCity(provinceId: string, destination: string, cities: Record<string, string>): string | undefined {
  if (Object.hasOwn(cities, provinceId)) return provinceId;
  const target = ` ${normalize(destination)} `;
  return Object.entries(cities).find(([id, name]) => target === ` ${normalize(id)} ` || target.includes(` ${normalize(name)} `)
    || id === 'sa-pa' && target.includes(' sapa '))?.[0];
}
