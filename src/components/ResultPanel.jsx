import { moneyKo, pct, gradeLabel } from '../calc.js';

function gradeClass(g) {
  return g === 3 ? 'is-ok' : g === 1 ? 'is-bad' : 'is-mid';
}

export default function ResultPanel({ zone, result, missing }) {
  if (missing.length > 0) {
    return (
      <section className="panel reading reading--empty">
        <h3>사업성 분석</h3>
        <p>아직 계산할 수 없습니다. 다음 항목을 먼저 입력하세요.</p>
        <ul className="missing-list">
          {missing.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </section>
    );
  }

  const { appraisal, cur, premium, premiumPct, verdict, verdictReason, grades } = result;

  return (
    <section className="panel reading">
      <header className="reading__head">
        <h3>사업성 분석</h3>
        <span className={'chip chip--lg ' + gradeClass(verdict)}>종합판정 {gradeLabel(verdict)}</span>
      </header>
      <p className="reading__sublabel">분담금</p>
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

      <p className="reading__verdict-reason">{verdictReason}</p>

      <div className="grade-grid">
        <div className={'grade-card ' + gradeClass(grades.margin.grade)}>
          <span className="grade-card__label">총수익률</span>
          <span className="grade-card__grade">{gradeLabel(grades.margin.grade)}</span>
          <span className="grade-card__note">{grades.margin.note}</span>
        </div>
        <div className={'grade-card ' + gradeClass(grades.safety.grade)}>
          <span className="grade-card__label">안전마진</span>
          <span className="grade-card__grade">{gradeLabel(grades.safety.grade)}</span>
          <span className="grade-card__note">{grades.safety.note}</span>
        </div>
        <div className={'grade-card ' + gradeClass(grades.rate.grade)}>
          <span className="grade-card__label">비례율</span>
          <span className="grade-card__grade">{gradeLabel(grades.rate.grade)}</span>
          <span className="grade-card__note">{grades.rate.note}</span>
        </div>
        <div className={'grade-card ' + gradeClass(grades.speed.grade)}>
          <span className="grade-card__label">사업속도</span>
          <span className="grade-card__grade">{gradeLabel(grades.speed.grade)}</span>
          <span className="grade-card__note">{grades.speed.note}</span>
        </div>
      </div>
      <p className="reading__disclaimer">
        총수익률이 뚜렷하게 좋거나(100% 이상 → 상) 나쁘면(40% 미만 → 하) 그대로 정해지고, 애매한 중간일 때만 나머지 세 기준이 한쪽으로
        쏠리면 한 단계 바뀝니다. 세금·이주비 이자는 뺀 간이 판정입니다.
      </p>
    </section>
  );
}
