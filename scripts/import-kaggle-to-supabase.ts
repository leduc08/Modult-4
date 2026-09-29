import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

dotenv.config();

const root = process.cwd();
const datasetDirectory = path.join(root, 'database/datasets/vietnam-tourism-v2');
const datasetRef = 'vuonglsts/vietnam-tourism-v2';
const datasetVersion = 1;
const sourceUrl = `https://www.kaggle.com/datasets/${datasetRef}`;
const batchSize = 200;

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Thiếu ${name} trong file .env.`);
  return value;
}

interface SourceArticle {
  title: string;
  paragraphs: Array<{
    context: string;
    qas: Array<{ id: string; question: string; answers: Array<{ text: string; answer_start: number }> }>;
  }>;
}

interface KnowledgeDocument {
  dataset_ref: string;
  dataset_version: number;
  split: 'train' | 'valid';
  passage_id: string;
  title: string;
  content: string;
  questions: SourceArticle['paragraphs'][number]['qas'];
  source_url: string;
}

async function main(): Promise<void> {
  const supabaseUrl = requiredEnvironment('SUPABASE_URL').replace(/\/$/, '');
  const secretKey = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!secretKey) throw new Error('Thiếu SUPABASE_SECRET_KEY trong file .env. Chỉ chạy script này ở máy tin cậy.');

  const documents: KnowledgeDocument[] = [];
  for (const split of ['train', 'valid'] as const) {
    const filePath = path.join(datasetDirectory, `${split}_vietnam_tourism.json`);
    if (!fs.existsSync(filePath)) throw new Error(`Không tìm thấy file dataset: ${filePath}`);
    const source = JSON.parse(fs.readFileSync(filePath, 'utf8')) as { data?: SourceArticle[] };
    if (!Array.isArray(source.data)) throw new Error(`File ${split} không có trường data hợp lệ.`);

    source.data.forEach((article, articleIndex) => article.paragraphs.forEach((paragraph, paragraphIndex) => {
      documents.push({
        dataset_ref: datasetRef,
        dataset_version: datasetVersion,
        split,
        passage_id: `${articleIndex}:${paragraphIndex}`,
        title: article.title,
        content: paragraph.context,
        questions: paragraph.qas,
        source_url: sourceUrl,
      });
    }));
  }

  const endpoint = `${supabaseUrl}/rest/v1/knowledge_documents?on_conflict=dataset_ref,dataset_version,split,passage_id`;
  let imported = 0;
  for (let start = 0; start < documents.length; start += batchSize) {
    const batch = documents.slice(start, start + batchSize);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        apikey: secretKey,
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(batch),
      signal: AbortSignal.timeout(60000),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      if (/could not find the table|does not exist/i.test(detail)) {
        throw new Error('Chưa có bảng knowledge_documents. Hãy chạy file supabase/migrations/202609270001_vietnam_tourism_knowledge.sql trong SQL Editor trước.');
      }
      throw new Error(`Supabase từ chối lô ${Math.floor(start / batchSize) + 1} (HTTP ${response.status}): ${detail.slice(0, 500)}`);
    }
    imported += batch.length;
    console.log(`Đã nhập ${imported}/${documents.length} đoạn…`);
  }

  console.log(`Hoàn tất: ${imported} đoạn train/valid từ ${datasetRef} v${datasetVersion}. Chạy lại script sẽ cập nhật bản ghi cũ, không tạo bản trùng.`);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : 'Import thất bại.');
  process.exitCode = 1;
});
