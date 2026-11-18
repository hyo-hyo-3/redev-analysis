import { useEffect, useRef, useState } from 'react';
import { allZones } from '../referenceZones.js';
import zoneCoords from '../data/zoneCoords.json';

const mappable = allZones.filter((z) => zoneCoords[z.id]);

function gradeDotColor(group) {
  return group === 'public' ? '#6f9bd1' : '#d98e2b';
}

export default function MapView() {
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const infoWindowRef = useRef(null);
  const [checked, setChecked] = useState(() => new Set(mappable.map((z) => z.id)));
  const [sdkReady, setSdkReady] = useState(typeof window !== 'undefined' && !!window.naver?.maps);

  useEffect(() => {
    if (sdkReady) return;
    const t = setInterval(() => {
      if (window.naver?.maps) {
        setSdkReady(true);
        clearInterval(t);
      }
    }, 200);
    return () => clearInterval(t);
  }, [sdkReady]);

  useEffect(() => {
    if (!sdkReady || !mapElRef.current || mapRef.current) return;
    mapRef.current = new window.naver.maps.Map(mapElRef.current, {
      center: new window.naver.maps.LatLng(37.5445, 127.0),
      zoom: 11,
    });
  }, [sdkReady]);

  useEffect(() => {
    if (!sdkReady || !mapRef.current) return;
    const { naver } = window;
    for (const [id, marker] of markersRef.current) {
      if (!checked.has(id)) {
        marker.setMap(null);
        markersRef.current.delete(id);
      }
    }
    for (const z of mappable) {
      if (!checked.has(z.id) || markersRef.current.has(z.id)) continue;
      const coord = zoneCoords[z.id];
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(coord.lat, coord.lng),
        map: mapRef.current,
        title: z.name,
        icon: {
          content: `<span class="map-dot" style="background:${gradeDotColor(z.group)}"></span>`,
          anchor: new naver.maps.Point(6, 6),
        },
      });
      naver.maps.Event.addListener(marker, 'click', () => {
        if (!infoWindowRef.current) {
          infoWindowRef.current = new naver.maps.InfoWindow({ content: '' });
        }
        infoWindowRef.current.setContent(
          `<div class="map-info"><b>${z.name}</b><span>${z.gu} · ${z.kind}</span><span>${z.stage}</span></div>`,
        );
        infoWindowRef.current.open(mapRef.current, marker);
      });
      markersRef.current.set(z.id, marker);
    }
  }, [sdkReady, checked]);

  function toggle(id) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function setAll(on) {
    setChecked(on ? new Set(mappable.map((z) => z.id)) : new Set());
  }

  return (
    <section className="panel map-view">
      <header className="scenario__head">
        <h3>지도</h3>
        <p className="scenario__caption">
          좌표가 확인된 {mappable.length}곳만 표시됩니다({allZones.length - mappable.length}곳은 조합 번호뿐인
          이름이라 정확한 위치를 아직 못 찾았습니다). 체크를 해제하면 지도에서 바로 빠집니다.
        </p>
      </header>

      <div className="map-view__layout">
        <div className="map-view__canvas" ref={mapElRef}>
          {!sdkReady && <p className="map-view__loading">지도를 불러오는 중입니다…</p>}
        </div>
        <div className="map-view__list">
          <div className="map-view__bulk">
            <button type="button" className="btn btn--quiet btn--sm" onClick={() => setAll(true)}>
              전체 체크
            </button>
            <button type="button" className="btn btn--quiet btn--sm" onClick={() => setAll(false)}>
              전체 해제
            </button>
          </div>
          <ul className="map-view__checklist">
            {mappable.map((z) => (
              <li key={z.id}>
                <label>
                  <input type="checkbox" checked={checked.has(z.id)} onChange={() => toggle(z.id)} />
                  <span className="map-dot" style={{ background: gradeDotColor(z.group) }} />
                  {z.name}
                  <span className="map-view__gu">{z.gu}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
