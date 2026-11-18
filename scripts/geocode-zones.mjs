// 전체 구역(referenceZones + archiveZones)의 주소를 네이버 Geocoding API로 좌표(위도/경도) 변환해
// src/data/zoneCoords.json에 저장합니다. 이름이 "oo구역"처럼 실제 주소가 아닌 곳은 찾지 못할 수 있습니다 —
// 그런 곳은 결과에서 빠지고, 실행 후 콘솔에 몇 곳을 못 찾았는지 알려줍니다.
//
// 실행: node --env-file=.env scripts/geocode-zones.mjs

import { writeFile, mkdir } from 'node:fs/promises';
import { allZones } from '../src/referenceZones.js';

const CLIENT_ID = process.env.VITE_NAVER_MAPS_CLIENT_ID;
const CLIENT_SECRET = process.env.NAVER_MAPS_CLIENT_SECRET;
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('.env에 VITE_NAVER_MAPS_CLIENT_ID / NAVER_MAPS_CLIENT_SECRET이 필요합니다.');
  process.exit(1);
}

// "oo13구역"처럼 실제 지번이 아니라 조합 번호만 있는 이름은 지오코딩이 엉뚱한 번지(그 숫자를
// 지번으로 오인)에 매칭되는 걸 확인했습니다(예: 신림1·5·6·7·9구역이 전부 같은 좌표로 잡힘).
// 그래서 이런 이름은 애초에 건너뜁니다 — 실제 좌표는 추후 수작업으로 보완하세요.
function isNicknameOnly(name) {
  return /\d+구역$/.test(name.trim());
}

function cleanAddress(gu, name) {
  const stripped = name
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/일대/g, '')
    .replace(/재개발|재건축/g, '')
    .trim();
  return `서울 ${gu} ${stripped}`.replace(/\s+/g, ' ').trim();
}

async function geocode(query) {
  const url = `https://maps.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      'X-NCP-APIGW-API-KEY-ID': CLIENT_ID,
      'X-NCP-APIGW-API-KEY': CLIENT_SECRET,
      Accept: 'application/json',
    },
  });
  const data = await res.json();
  if (data.status !== 'OK' || !data.addresses?.length) return null;
  const a = data.addresses[0];
  return { lat: parseFloat(a.y), lng: parseFloat(a.x), matchedAddress: a.roadAddress || a.jibunAddress };
}

async function run() {
  const coords = {};
  const failed = [];
  for (const z of allZones) {
    if (isNicknameOnly(z.name)) {
      failed.push(z.name + ' (조합 번호뿐, 지번 아님)');
      console.log(`[건너뜀] ${z.name} — 조합 번호뿐이라 지번 주소가 아님`);
      continue;
    }
    const query = cleanAddress(z.gu, z.name);
    try {
      const found = await geocode(query);
      if (found) {
        coords[z.id] = found;
        console.log(`[찾음] ${z.name} → ${found.matchedAddress} (${found.lat}, ${found.lng})`);
      } else {
        failed.push(z.name);
        console.log(`[못찾음] ${z.name} (${query})`);
      }
    } catch (e) {
      failed.push(z.name);
      console.log(`[오류] ${z.name}: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 150));
  }

  await mkdir(new URL('../src/data', import.meta.url), { recursive: true });
  await writeFile(
    new URL('../src/data/zoneCoords.json', import.meta.url),
    JSON.stringify(coords, null, 2) + '\n',
  );

  console.log(`\n완료: ${Object.keys(coords).length}곳 좌표 저장, ${failed.length}곳 못 찾음.`);
  if (failed.length) console.log('못 찾은 곳:', failed.join(', '));
}

run();
