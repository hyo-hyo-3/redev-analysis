import { moneyKo, pct, gradeLabel } from '../calc.js';

function gradeClass(g) {
  return g === 3 ? 'is-ok' : g === 1 ? 'is-bad' : 'is-mid';
}

export default function ResultPanel({ zone, result, missing }) {
  if (missing.length > 0) {
    return (
      <section className="panel reading reading--empty">
        <h3>아직 계산할 수 없습니다</h3>
        <p>다음 항목을 먼저 입력하세요.</p>
        <ul className="missing-list">
          {missing.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </section>
    );
  }

  const { appraisal, cur, premium, premiumPct, safetyGrade, verdict } = result;

  return (
    <section className="panel reading">
      <header className="reading__head">
        <h3>분담금</h3>
        <span className={'chip ' + gradeClass(verdict)}>종합판정 {gradeLabel(verdict)}</span>
      </header>
      <p className="reading__value measured" aria-live="polite">
        {moneyKo(cur.contribution)}
      </p>
      <p className="reading__note">
        {cur.contribution >= 0 ? '조합원이 추가로 내는 금액입니다.' : '조합원에게 돌려주는 환급금입니다.'}
      </p>

      <dl className="reading__formula">
        <div>
          <dt>권리가액</dt>
          <dd>
            <span className="measured is-instrument">{moneyKo(appraisal)}</span>
            <span className="reading__op">×</span>
            <span className="measured is-instrument">{zone.rate || 0}%</span>
            <span className="reading__op">=</span>
            <span className="measured is-instrument">{moneyKo(cur.rights)}</span>
          </dd>
        </div>
        <div>
          <dt>분담금</dt>
          <dd>
            <span className="measured is-person">{moneyKo(Number(zone.price) || 0)}</span>
            <span className="reading__op">−</span>
            <span className="measured is-instrument">{moneyKo(cur.rights)}</span>
            <span className="reading__op">=</span>
            <span className="measured is-person">{moneyKo(cur.contribution)}</span>
          </dd>
        </div>
      </dl>

      <div className="stats">
        <div>
          <b className="measured">{moneyKo(cur.invest)}</b>
          <span>총투입금 (매매가+분담금+기타비용)</span>
        </div>
        <div>
          <b className={'measured ' + (cur.profit >= 0 ? 'is-ok' : 'is-bad')}>{moneyKo(cur.profit)}</b>
          <span>예상차익</span>
        </div>
        <div>
          <b className={'measured ' + (cur.returnPct >= 0 ? 'is-ok' : 'is-bad')}>{pct(cur.returnPct)}</b>
          <span>총수익률</span>
        </div>
        <div>
          <b className="measured">{moneyKo(premium)}</b>
          <span>피 ({pct(premiumPct)})</span>
        </div>
      </div>

      <div className="chip-row">
        <span className={'chip ' + gradeClass(safetyGrade)}>
          안전마진 {gradeLabel(safetyGrade)} · 시세 10% 하락 가정
        </span>
      </div>
    </section>
  );
}
