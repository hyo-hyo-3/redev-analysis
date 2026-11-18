import { useState } from 'react';
import news from '../data/news.json';

const FILTERS = [
  ['all', '전체'],
  ['shintong', '신통기획'],
  ['public', '공공재개발'],
  ['policy', '정책·제도'],
];

const CATEGORY_LABEL = { shintong: '신통기획', public: '공공재개발', policy: '정책·제도' };

const PAGE_SIZE = 10;

const sorted = [...news].sort((a, b) => (a.date < b.date ? 1 : -1));
const lastUpdated = sorted[0]?.date;

export default function NewsPanel() {
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);

  function changeFilter(key) {
    setFilter(key);
    setPage(1);
  }

  const filtered = sorted.filter((n) => filter === 'all' || n.category === filter);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const items = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function goToPage(n) {
    setPage(Math.min(Math.max(1, n), pageCount));
  }

  return (
    <section className="panel news">
      <header className="scenario__head">
        <h3>재개발 소식</h3>
        <p className="scenario__caption">
          신통기획·공공재개발 관련 정책, 후보지 선정, 사업 추진 소식을 모읍니다. 마지막 업데이트: {lastUpdated}.
        </p>
      </header>

      <div className="rail-filters" role="group" aria-label="소식 분류">
        {FILTERS.map(([key, label]) => {
          const n = key === 'all' ? sorted.length : sorted.filter((x) => x.category === key).length;
          return (
            <button
              key={key}
              type="button"
              className="chip chip--filter"
              aria-pressed={filter === key}
              onClick={() => changeFilter(key)}
            >
              {label} {n}
            </button>
          );
        })}
      </div>

      <ul className="news__list">
        {items.map((n) => (
          <li key={n.id} className="news__item">
            <div className="news__meta">
              <time dateTime={n.date}>{n.date}</time>
              <span className="chip chip--tag">{CATEGORY_LABEL[n.category]}</span>
            </div>
            <h4>
              <a href={n.url} target="_blank" rel="noreferrer">
                {n.title}
              </a>
            </h4>
            {n.summary && <p className="news__summary">{n.summary}</p>}
            <p className="news__source">{n.source}</p>
          </li>
        ))}
      </ul>

      {pageCount > 1 && (
        <nav className="pager" aria-label="재개발 소식 페이지">
          <button type="button" className="btn btn--quiet btn--sm" onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}>
            이전
          </button>
          <span className="pager__status">
            {currentPage} / {pageCount} 페이지 · {filtered.length}건
          </span>
          <button type="button" className="btn btn--quiet btn--sm" onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= pageCount}>
            다음
          </button>
        </nav>
      )}
    </section>
  );
}
