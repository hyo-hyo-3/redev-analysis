import { computeResult, moneyKo, pct, gradeLabel, toNum } from '../calc.js';

function hasEnoughInput(zone) {
  const hasAppraisal = toNum(zone.appraisal) > 0 || (toNum(zone.official) > 0 && toNum(zone.mult) > 0);
  return hasAppraisal && toNum(zone.rate) > 0 && toNum(zone.price) > 0;
}

function gradeClass(g) {
  return g === 3 ? 'is-ok' : g === 1 ? 'is-bad' : 'is-mid';
}

export default function ZoneOverview({ zones, onPick }) {
  return (
    <section className="panel scenario overview">
      <header className="scenario__head">
        <h3>내 구역 비교</h3>
        <p className="scenario__caption">내가 등록한 구역 {zones.length}곳을 한눈에 비교합니다. 행을 누르면 그 구역으로 이동합니다.</p>
      </header>
      <div className="scenario__scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">구역</th>
              <th scope="col">위치 · 단계</th>
              <th scope="col" className="num">비례율</th>
              <th scope="col" className="num">분담금</th>
              <th scope="col" className="num">총투입금</th>
              <th scope="col" className="num">예상차익</th>
              <th scope="col" className="num">총수익률</th>
              <th scope="col">종합판정</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((z) => {
              const ok = hasEnoughInput(z);
              const r = ok ? computeResult(z) : null;
              return (
                <tr
                  key={z.id}
                  className="overview__row"
                  onClick={() => onPick(z.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onPick(z.id);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`${z.name || '이름 없는 구역'} 구역으로 이동`}
                >
                  <th scope="row">{z.name || '이름 없는 구역'}</th>
                  <td>{[z.location, z.stage].filter(Boolean).join(' · ') || '—'}</td>
                  {ok ? (
                    <>
                      <td className="num measured">{toNum(z.rate)}%</td>
                      <td className="num measured">{moneyKo(r.cur.contribution)}</td>
                      <td className="num measured">{moneyKo(r.cur.invest)}</td>
                      <td className={'num measured ' + (r.cur.profit >= 0 ? 'is-ok' : 'is-bad')}>
                        {moneyKo(r.cur.profit)}
                      </td>
                      <td className={'num measured ' + (r.cur.returnPct >= 0 ? 'is-ok' : 'is-bad')}>
                        {pct(r.cur.returnPct)}
                      </td>
                      <td>
                        <span className={'chip ' + gradeClass(r.verdict)}>{gradeLabel(r.verdict)}</span>
                      </td>
                    </>
                  ) : (
                    <td className="overview__incomplete" colSpan={5}>
                      입력이 더 필요합니다
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
