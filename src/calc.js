// 재개발 사업성 · 분담금 계산. 단위: 만원(10,000원).
// 권리가액 = 감정평가액 × 비례율
// 분담금   = 조합원 분양가 − 권리가액 (음수면 환급금)
// 총투입금 = 매매가 + 분담금 + 기타비용
// 예상차익 = 입주 후 예상 시세 − 총투입금

export function toNum(v) {
  const n = Number(String(v ?? '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function resolveAppraisal(fields) {
  const direct = toNum(fields.appraisal);
  if (direct > 0) return direct;
  return toNum(fields.official) * toNum(fields.mult);
}

export function calcAt(fields, rate, appraisal) {
  const price = toNum(fields.price);
  const buy = toNum(fields.buy);
  const etc = toNum(fields.etc);
  const resale = toNum(fields.resale);
  const rights = appraisal * (rate / 100);
  const contribution = price - rights;
  const invest = buy + contribution + etc;
  const profit = resale - invest;
  const returnPct = invest > 0 ? (profit / invest) * 100 : null;
  return { rate, appraisal, rights, contribution, invest, profit, returnPct };
}

export function computeResult(fields) {
  const appraisal = resolveAppraisal(fields);
  const rate = toNum(fields.rate);
  const resale = toNum(fields.resale);
  const buy = toNum(fields.buy);
  const cur = calcAt(fields, rate, appraisal);

  const premium = buy - appraisal;
  const premiumPct = appraisal > 0 ? (premium / appraisal) * 100 : null;

  const profitDown10 = resale * 0.9 - cur.invest;
  const safetyGrade = profitDown10 >= 0 ? 3 : cur.profit >= 0 ? 2 : 1;

  let verdict = 2;
  if (cur.returnPct !== null) {
    if (cur.returnPct >= 50 && safetyGrade >= 2) verdict = 3;
    else if (cur.returnPct < 0 || safetyGrade === 1) verdict = 1;
  }

  return { appraisal, cur, premium, premiumPct, profitDown10, safetyGrade, verdict };
}

export function gradeLabel(g) {
  return g === 3 ? '상' : g === 2 ? '중' : '하';
}

export function rateScenarios(fields) {
  const appraisal = resolveAppraisal(fields);
  const rate = toNum(fields.rate);
  const deltas = [-20, -15, -10, -5, 0, 5, 10, 15, 20];
  return deltas
    .map((d) => rate + d)
    .filter((r) => r > 0)
    .map((r) => ({ ...calcAt(fields, r, appraisal), isCurrent: Math.abs(r - rate) < 0.001 }));
}

export function multScenarios(fields) {
  const mult = toNum(fields.mult);
  const rate = toNum(fields.rate);
  const official = toNum(fields.official);
  const deltas = [-0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3];
  return deltas
    .map((d) => Math.round((mult + d) * 100) / 100)
    .filter((m) => m > 0)
    .map((m) => {
      const appraisal = official * m;
      return { mult: m, ...calcAt(fields, rate, appraisal), isCurrent: Math.abs(m - mult) < 0.001 };
    });
}

export function moneyKo(n) {
  if (!Number.isFinite(n)) return '—';
  const sign = n < 0 ? '−' : '';
  const abs = Math.round(Math.abs(n));
  const eok = Math.floor(abs / 10000);
  const rest = abs % 10000;
  if (eok > 0) {
    return `${sign}${eok}억${rest > 0 ? ' ' + rest.toLocaleString('ko-KR') + '만원' : ''}`;
  }
  return `${sign}${abs.toLocaleString('ko-KR')}만원`;
}

export function pct(n, digits = 1) {
  if (n === null || !Number.isFinite(n)) return '—';
  const sign = n >= 0 ? '+' : '−';
  return `${sign}${Math.abs(n).toFixed(digits)}%`;
}
