import fs from 'node:fs';
import path from 'node:path';

export const TOURISM_DATASET_URL = 'https://www.kaggle.com/datasets/vuonglsts/vietnam-tourism-v2';

interface TourismArticle {
  title: string;
  paragraphs: Array<{ context: string; qas: Array<{ id: string; question: string; answers: Array<{ text: string; answer_start: number }> }> }>;
}

export interface KnowledgeMatch {
  id: string;
  title: string;
  context: string;
  sourceUrl: string;
  score: number;
}

export function normalizeTourismText(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
}

const STOP_WORDS = new Set('toi minh ban cho hay la va cua co nhung gi nao duoc mot cac ve o tai voi de khi thi trong den muon hoi the nao nhieu rat'.split(' '));
function tokenize(text: string): string[] {
  const words = normalizeTourismText(text).match(/[a-z0-9]+/g) || [];
  return [
    ...words.filter(word => !STOP_WORDS.has(word)),
    ...words.slice(1).map((word, index) => `${words[index]} ${word}`).filter(pair => pair.split(' ').every(word => !STOP_WORDS.has(word))),
  ];
}

// Use training contexts for retrieval; keep validation questions separate for evaluation.
const sourcePath = path.resolve(process.cwd(), 'database/datasets/vietnam-tourism-v2/train_vietnam_tourism.json');
const raw = JSON.parse(fs.readFileSync(sourcePath, 'utf8')) as { data: TourismArticle[] };
if (!Array.isArray(raw.data)) throw new Error('Invalid vietnam-tourism-v2 dataset: expected data array');

const documents: Array<KnowledgeMatch & { terms: Map<string, number>; length: number; normalizedTitle: string }> = [];
const frequency = new Map<string, number>();
const seenContexts = new Set<string>();
let questionCount = 0;
raw.data.forEach((article, articleIndex) => {
  article.paragraphs.forEach((paragraph, paragraphIndex) => {
    questionCount += paragraph.qas.length;
    if (seenContexts.has(paragraph.context)) return;
    seenContexts.add(paragraph.context);
    const words = tokenize(`${article.title} ${article.title} ${paragraph.context} ${paragraph.qas.map(qa => qa.question).join(' ')}`);
    const terms = new Map<string, number>();
    words.forEach(word => terms.set(word, (terms.get(word) || 0) + 1));
    terms.forEach((_, term) => frequency.set(term, (frequency.get(term) || 0) + 1));
    documents.push({
      id: `kaggle-train-${articleIndex}-${paragraphIndex}`,
      title: article.title, context: paragraph.context,
      sourceUrl: TOURISM_DATASET_URL, score: 0,
      terms, length: words.length, normalizedTitle: normalizeTourismText(article.title),
    });
  });
});
const averageLength = documents.reduce((sum, document) => sum + document.length, 0) / (documents.length || 1);

export const TOURISM_KNOWLEDGE_STATS = {
  dataset: 'vuonglsts/vietnam-tourism-v2', version: 1, split: 'train',
  articles: raw.data.length, passages: documents.length, questions: questionCount,
};

/** Lightweight BM25 retrieval with Vietnamese accent normalization and phrase matching. */
export function searchTourismKnowledge(query: string, limit = 4): KnowledgeMatch[] {
  const queryTerms = [...new Set(tokenize(query))];
  if (!queryTerms.length) return [];
  return documents.map(document => {
    let score = 0;
    for (const term of queryTerms) {
      const count = document.terms.get(term) || 0;
      if (!count) continue;
      const df = frequency.get(term) || 0;
      const idf = Math.log(1 + (documents.length - df + 0.5) / (df + 0.5));
      score += idf * (count * 2.2) / (count + 1.2 * (0.25 + 0.75 * document.length / averageLength));
      if (term.includes(' ') && document.normalizedTitle.includes(term)) score += idf * 3;
    }
    return { id: document.id, title: document.title, context: document.context, sourceUrl: document.sourceUrl, score };
  }).filter(document => document.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(0, Math.min(limit, 8)));
}
