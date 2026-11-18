const KEY = 'redev-analysis:zones:v1';

export function loadZones() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.zones)) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveZones(data) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // 저장 공간을 쓸 수 없는 환경(사생활 보호 모드 등)에서는 조용히 건너뜁니다.
  }
}

export function emptyZone(id, name = '') {
  return {
    id,
    name,
    location: '',
    stage: '',
    note: '',
    official: '',
    mult: '1.3',
    appraisal: '',
    rate: '100',
    price: '',
    buy: '',
    etc: '0',
    resale: '',
    years: '12',
  };
}

export function makeId() {
  return 'z' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
