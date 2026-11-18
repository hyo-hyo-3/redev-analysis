// 참고 구역의 인근 신축 시세를 국토교통부 Open API(아파트 매매 실거래가)로 다시 확인합니다.
// 값을 파일에 바로 쓰지 않고, src/referenceZones.js에 있는 값과 다른 곳만 콘솔에 보고합니다.
// 바뀐 값은 확인한 뒤 직접 src/referenceZones.js의 resalePrices에 반영하세요.
//
// 실행: node --env-file=.env scripts/update-resale-prices.mjs
// (.env.example을 복사해 .env를 만들고 MOLIT_SERVICE_KEY를 채워 두세요. data.go.kr에서 발급받은 키입니다.)

import https from 'node:https';

const SERVICE_KEY = process.env.MOLIT_SERVICE_KEY;
if (!SERVICE_KEY) {
  console.error('MOLIT_SERVICE_KEY가 설정되지 않았습니다. .env.example을 복사해 .env를 만들고 키를 채운 뒤, "node --env-file=.env scripts/update-resale-prices.mjs"로 실행하세요.');
  process.exit(1);
}

/* 구 단위 법정동코드 (5자리) */
const LAWD = {
  '관악구': '11620', '영등포구': '11560', '서대문구': '11410', '광진구': '11215',
  '중랑구': '11260', '금천구': '11545', '강동구': '11740', '용산구': '11170',
  '은평구': '11380', '구로구': '11530',
};

// 참고: 아래 apt 값은 기사에 쓰인 표기 그대로라, 공공데이터의 정확한 단지명과
// 띄어쓰기가 다르면 못 찾을 수 있습니다. 못 찾으면 fetchAptTrade 결과(items)를
// 한 번 찍어서 실제 단지명을 확인한 뒤 이 값을 맞춰 주세요. 특히 '중곡'은
// 정확한 단지명이 아니라서 매칭이 안 될 가능성이 높습니다.
const resaleData = [
  { zone: '신림9구역', gu: '관악구', apt: '힐스테이트뉴포레', sizes: [['20평형(전용59㎡대)', 103000], ['34평형(전용84㎡대)', 164000]] },
  { zone: '양평13구역', gu: '영등포구', apt: '양평현대6차', sizes: [['59형(전용59㎡대)', 140500], ['84형(전용84㎡대)', 154000]] },
  { zone: '연희2구역', gu: '서대문구', apt: '연희대우', sizes: [['25평형(전용59㎡대)', 102000], ['33평형(전용84㎡대)', 128000]] },
  { zone: '중곡1동 254-15 일대', gu: '광진구', apt: '중곡', sizes: [['18평형', 64928]] },
  { zone: '중화6구역', gu: '중랑구', apt: '중화동 한신', sizes: [['21평형(전용59㎡대)', 76000], ['33평형(전용84㎡대)', 99000]] },
  { zone: '독산1구역', gu: '금천구', apt: '독산동중앙하이츠빌', sizes: [['84형(전용84㎡대)', 84000]] },
  { zone: '독산2구역', gu: '금천구', apt: '독산동중앙하이츠빌', sizes: [['84형(전용84㎡대)', 84000]] },
  { zone: '천호A1-1구역', gu: '강동구', apt: '천호동삼성', sizes: [['59형(전용59㎡대)', 103000], ['85형(전용84㎡대)', 110000]] },
  { zone: '청파2구역', gu: '용산구', apt: '아이딜아파트', sizes: [['21평형(전용59㎡대)', 78000], ['30평형(전용84㎡대)', 95000]] },
  { zone: '불광동 600번지', gu: '은평구', apt: '불광롯데캐슬', sizes: [['25평형(전용59㎡대)', 104000], ['33평형(전용84㎡대)', 114000]] },
  { zone: '도림1구역', gu: '영등포구', apt: '영등포아트자이', sizes: [['24평형(전용59㎡대)', 146000], ['32평형(전용84㎡대)', 163000]] },
  { zone: '구로동 466 일대', gu: '구로구', apt: '신구로자이', sizes: [['84형(전용84㎡대)', 84000]] },
];

/* YYYYMM 문자열, n개월 전 */
function ymd(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return '' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0');
}

/* API 호출 (XML 응답) */
function fetchAptTrade(lawdCd, dealYmd) {
  return new Promise((resolve, reject) => {
    // 개발계정 활용신청은 운영 엔드포인트가 아니라 Dev 엔드포인트로 호출해야 합니다.
    const url = `https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev`
      + `?serviceKey=${SERVICE_KEY}&LAWD_CD=${lawdCd}&DEAL_YMD=${dealYmd}&numOfRows=1000&pageNo=1`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

/* 간단한 XML 파서 (외부 라이브러리 없이 <item>...</item> 추출) */
function parseItems(xml) {
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  return items.map((item) => {
    const get = (tag) => {
      const m = item.match(new RegExp(`<${tag}>([^<]*)<\/${tag}>`));
      return m ? m[1].trim() : '';
    };
    return {
      name: get('aptNm'),
      area: parseFloat(get('excluUseAr')),
      amount: parseInt(get('dealAmount').replace(/,/g, ''), 10) || 0, // 만원 단위
      year: get('dealYear'), month: get('dealMonth'), day: get('dealDay'),
    };
  });
}

/* 단지명 부분일치 + 가장 가까운 전용면적 매칭 */
function findLatestPrice(items, aptName, targetArea) {
  const matched = items.filter((it) => it.name.includes(aptName) || aptName.includes(it.name));
  if (matched.length === 0) return null;
  matched.sort((a, b) => Math.abs(a.area - targetArea) - Math.abs(b.area - targetArea));
  const closest = matched.filter((it) => Math.abs(it.area - matched[0].area) < 0.5);
  closest.sort((a, b) => (b.year + b.month + b.day).localeCompare(a.year + a.month + a.day));
  return closest[0];
}

/* 평형 라벨에서 대략적인 전용면적(㎡) 추정 */
function guessArea(label) {
  const m = label.match(/(\d+)㎡/);
  if (m) return parseFloat(m[1]);
  const p = label.match(/(\d+)평/);
  if (p) return parseFloat(p[1]) * 3.3058 * 0.75; // 평형 표기는 보통 공급면적 기준이라 대략 보정
  return 59;
}

/* 구역 하나 업데이트 (최근 3개월까지 거슬러 탐색) */
async function updateZone(z) {
  const lawdCd = LAWD[z.gu];
  if (!lawdCd) return { zone: z.zone, error: '법정동코드 없음: ' + z.gu };

  let items = [];
  for (let m = 0; m < 3 && items.length === 0; m++) {
    const xml = await fetchAptTrade(lawdCd, ymd(m));
    items = parseItems(xml).filter((it) => it.name.includes(z.apt) || z.apt.includes(it.name));
  }
  if (items.length === 0) return { zone: z.zone, apt: z.apt, updated: [] };

  const updated = z.sizes.map(([label, oldPrice]) => {
    const targetArea = guessArea(label);
    const found = findLatestPrice(items, z.apt, targetArea);
    if (!found) return { label, oldPrice, newPrice: null };
    return { label, oldPrice, newPrice: found.amount, date: `${found.year}-${found.month}-${found.day}` };
  });
  return { zone: z.zone, apt: z.apt, updated };
}

async function run() {
  const results = [];
  for (const z of resaleData) {
    try {
      const r = await updateZone(z);
      results.push(r);
      await new Promise((r2) => setTimeout(r2, 200)); // API 과도호출 방지
    } catch (e) {
      results.push({ zone: z.zone, error: e.message });
    }
  }

  results.forEach((r) => {
    if (r.error) { console.log(`[실패] ${r.zone}: ${r.error}`); return; }
    if (!r.updated || r.updated.length === 0) { console.log(`[거래없음] ${r.zone} (${r.apt})`); return; }
    r.updated.forEach((u) => {
      if (u.newPrice == null) {
        console.log(`[유지] ${r.zone} ${u.label}: ${u.oldPrice}만원 (최근 실거래 없음)`);
      } else if (u.newPrice !== u.oldPrice) {
        console.log(`[변경] ${r.zone} ${u.label}: ${u.oldPrice}만원 → ${u.newPrice}만원 (${u.date} 거래)`);
      } else {
        console.log(`[동일] ${r.zone} ${u.label}: ${u.newPrice}만원 (변동 없음)`);
      }
    });
  });

  return results;
}

run();
