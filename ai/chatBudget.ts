// Local parsing only: extracting a budget does not require another model call.
export function extractChatBudget(userMessages: string[]): number | undefined {
  const amounts = /(?<![\d.,])([\d]+(?:[.,]\d+)*)\s*(triệu|tr|nghìn|ngàn|k|vnđ|vnd|đồng|đ)(?![\p{L}\p{N}])/giu;
  for (const original of [...userMessages].reverse()) {
    const text = original.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
      .replace(/trieu/g, 'triệu').replace(/nghin/g, 'nghìn').replace(/ngan/g, 'ngàn').replace(/dong/g, 'đồng').replace(/(\d[\d.,]*\s*)d\b/g, '$1đ');
    const matches = [...text.matchAll(amounts)];
    const match = matches.at(-1);
    if (!match) continue;
    const unit = match[2].toLowerCase();
    const smallUnit = /^(triệu|tr|nghìn|ngàn|k)$/.test(unit);
    const number = smallUnit
      ? Number(match[1].replace(',', '.'))
      : Number(match[1].replace(/[.,]/g, ''));
    const amount = number * (/^(triệu|tr)$/.test(unit) ? 1000000 : /^(nghìn|ngàn|k)$/.test(unit) ? 1000 : 1);
    if (Number.isFinite(amount) && amount > 0) return Math.round(amount);
  }
  return undefined;
}
