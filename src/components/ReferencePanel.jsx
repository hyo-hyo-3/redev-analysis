import { useState } from 'react';
import { referenceZones } from '../referenceZones.js';
import { moneyKo } from '../calc.js';

const FILTERS = [
  ['all', '전체'],
  ['public', '공공재개발'],
  ['shintong', '신통기획'],
];

export default function ReferencePanel({ onApply }) {
  const [filter, setFilter] = useState('all');
  const zones = referenceZones.filter((z) => filter === 'all' || z.group === filter);

  return (
    <section className="panel reference">
      <header className="scenario__head">
        <h3>참고 구역</h3>
        <p className="scenario__caption">
          뉴스·고시문 등 공개 자료에서 뽑은 추정치입니다. 확정 값은 각 구역의 관리처분계획(안)에서 나오니, 출처를 직접
          확인하세요.
        </p>
        <p className="reference__glossary">
          <b>공공재개발</b> LH·SH가 시행에 참여합니다. <b>신통기획</b> 서울시가 정비계획 초기부터 가이드라인을 주는
          민간 재개발입니다.
        </p>
      </header>

      <div className="rail-filters" role="group" aria-label="구역 분류">
        {FILTERS.map(([key, label]) => {
          const n = key === 'all' ? referenceZones.length : referenceZones.filter((z) => z.group === key).length;
          return (
            <button
              key={key}
              type="button"
              className="chip chip--filter"
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
            >
              {label} {n}
            </button>
          );
        })}
      </div>

      <div className="reference__list">
        {zones.map((z) => (
          <article key={z.id} className="ref-card">
            <header className="ref-card__head">
              <div>
                <h4>{z.name}</h4>
                <p className="ref-card__meta">
                  {z.gu} · {z.kind}
                  {z.old ? ' · 오래된 자료' : ''}
                </p>
              </div>
              <div className="ref-card__rate">
                <span className="measured">{z.rate != null ? `${z.rate}%` : '공개 전'}</span>
                <span className="ref-card__asof">{z.asOf}</span>
              </div>
            </header>
            <p className="ref-card__stage">{z.stage}</p>

            <details className="ref-card__details">
              <summary>세부 자료 보기</summary>
              {z.facts.length > 0 && (
                <dl className="ref-card__facts">
                  {z.facts.map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {z.prices.length > 0 && (
                <div className="ref-card__prices">
                  <p className="ref-card__pricesLabel">{z.pricesLabel}</p>
                  <ul>
                    {z.prices.map(([size, price]) => (
                      <li key={size}>
                        <span>{size}</span>
                        <span className="measured">{moneyKo(price)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {z.resalePrices.length > 0 && (
                <div className="ref-card__prices">
                  <p className="ref-card__pricesLabel">{z.resaleLabel}</p>
                  <ul>
                    {z.resalePrices.map(([size, price]) => (
                      <li key={size}>
                        <span>{size}</span>
                        <span className="measured">{moneyKo(price)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="ref-card__note">{z.note}</p>
              <p className="ref-card__source">
                출처:{' '}
                <a href={z.url} target="_blank" rel="noreferrer">
                  {z.source}
                </a>
              </p>
            </details>

            <button type="button" className="btn btn--sm" onClick={() => onApply(z)}>
              이 비례율로 새 구역 만들기
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
