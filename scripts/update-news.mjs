// 구글 뉴스 RSS에서 재개발·신통기획·공공재개발 관련 기사를 가져와 src/data/news.json을 갱신합니다.
// API 키가 필요 없는 공개 RSS라 별도 발급 없이 바로 돌릴 수 있습니다.
// 실행: node scripts/update-news.mjs

import { readFile, writeFile } from 'node:fs/promises';

const NEWS_PATH = new URL('../src/data/news.json', import.meta.url);
const MAX_ITEMS = 40;

const QUERIES = [
  { q: '신속통합기획 재개발', category: 'shintong' },
  { q: '공공재개발', category: 'public' },
  { q: '재개발 정비사업 서울시', category: 'policy' },
];

function toIsoDate(pubDate) {
  const d = new Date(pubDate);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

async function fetchCategory({ q, category }) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=ko&gl=KR&ceid=KR:ko`;
  const res = await fetch(url);
  const xml = await res.text();
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  return items.slice(0, 15).map((item) => {
    const get = (tag) => {
      const m = item.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
      return m ? decodeEntities(m[1].replace(/<!\[CDATA\[|\]\]>/g, '')).trim() : '';
    };
    const rawTitle = get('title');
    const sourceMatch = rawTitle.match(/ - ([^-]+)$/);
    const title = sourceMatch ? rawTitle.slice(0, -sourceMatch[0].length).trim() : rawTitle;
    const source = sourceMatch ? sourceMatch[1].trim() : get('source');
    const date = toIsoDate(get('pubDate'));
    return { title, url: get('link'), source, date, category };
  });
}

async function run() {
  const existingRaw = await readFile(NEWS_PATH, 'utf8').catch(() => '[]');
  const existing = JSON.parse(existingRaw);
  const seenTitles = new Set(existing.map((n) => n.title));

  const fetched = [];
  for (const query of QUERIES) {
    try {
      const items = await fetchCategory(query);
      fetched.push(...items);
    } catch (e) {
      console.log(`[실패] ${query.q}: ${e.message}`);
    }
  }

  let nextId = existing.reduce((max, n) => Math.max(max, parseInt(n.id?.slice(1) || '0', 10) || 0), 0) + 1;
  const added = [];
  for (const item of fetched) {
    if (!item.title || !item.date || seenTitles.has(item.title)) continue;
    seenTitles.add(item.title);
    added.push({
      id: `n${nextId++}`,
      date: item.date,
      category: item.category,
      title: item.title,
      summary: '',
      source: item.source || '출처 확인 필요',
      url: item.url,
    });
  }

  const merged = [...existing, ...added]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, MAX_ITEMS);

  await writeFile(NEWS_PATH, JSON.stringify(merged, null, 2) + '\n');
  console.log(`새 기사 ${added.length}건 추가, 전체 ${merged.length}건 저장했습니다.`);
}

run();
