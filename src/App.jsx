import { useEffect, useMemo, useState } from 'react';
import ZoneRail from './components/ZoneRail.jsx';
import TopTabs from './components/TopTabs.jsx';
import InputPanel from './components/InputPanel.jsx';
import ResultPanel from './components/ResultPanel.jsx';
import ScenarioTable from './components/ScenarioTable.jsx';
import ZoneOverview from './components/ZoneOverview.jsx';
import BackupControls from './components/BackupControls.jsx';
import ReferencePanel from './components/ReferencePanel.jsx';
import MapView from './components/MapView.jsx';
import NewsPanel from './components/NewsPanel.jsx';
import BoardPanel from './components/BoardPanel.jsx';
import { loadZones, saveZones, emptyZone, makeId } from './storage.js';
import { computeResult, rateScenarios, multScenarios, toNum } from './calc.js';
import { averageKnownRate } from './referenceZones.js';

const THEME_KEY = 'redev-analysis:theme:v1';

function loadTheme() {
  try {
    return window.localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

function nextZoneName(zones) {
  const used = new Set(zones.map((z) => z.name));
  let n = zones.length + 1;
  while (used.has(`구역 ${n}`)) n += 1;
  return `구역 ${n}`;
}

function makeMissingList(zone) {
  const missing = [];
  const hasAppraisal = toNum(zone.appraisal) > 0 || (toNum(zone.official) > 0 && toNum(zone.mult) > 0);
  if (!hasAppraisal) missing.push('공시가격·배율 또는 감정평가액 확정값');
  if (!(toNum(zone.rate) > 0)) missing.push('비례율');
  if (!(toNum(zone.price) > 0)) missing.push('조합원 분양가');
  return missing;
}

export default function App() {
  const [state, setState] = useState(() => {
    const loaded = loadZones();
    if (loaded && loaded.zones.length > 0) return loaded;
    const id = makeId();
    return { zones: [emptyZone(id, '구역 1')], activeId: id };
  });

  const [theme, setTheme] = useState(loadTheme);
  const [view, setView] = useState('map');

  useEffect(() => {
    saveZones(state);
  }, [state]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      // 저장 공간을 쓸 수 없는 환경에서는 조용히 건너뜁니다.
    }
  }, [theme]);

  const activeZone = useMemo(
    () => state.zones.find((z) => z.id === state.activeId) || state.zones[0],
    [state],
  );

  function updateZone(next) {
    setState((s) => ({ ...s, zones: s.zones.map((z) => (z.id === next.id ? next : z)) }));
  }

  function addZone() {
    const id = makeId();
    setState((s) => ({ zones: [...s.zones, emptyZone(id, nextZoneName(s.zones))], activeId: id }));
  }

  function removeZone(id) {
    setState((s) => {
      const zones = s.zones.filter((z) => z.id !== id);
      if (zones.length === 0) {
        const newId = makeId();
        return { zones: [emptyZone(newId, '구역 1')], activeId: newId };
      }
      const activeId = s.activeId === id ? zones[0].id : s.activeId;
      return { zones, activeId };
    });
  }

  function setViewAndSelect(nextView, zoneId) {
    if (zoneId) setState((s) => ({ ...s, activeId: zoneId }));
    setView(nextView);
  }

  function importZones(imported) {
    if (imported.length === 0) return;
    setState((s) => ({ zones: [...s.zones, ...imported], activeId: imported[0].id }));
    setView('detail');
  }

  function createFromReference(ref) {
    const id = makeId();
    const rate = ref.rate ?? averageKnownRate();
    const zone = {
      ...emptyZone(id, `${ref.name} (${ref.short})`),
      location: ref.gu,
      stage: ref.stage,
      rate: String(rate),
      mult: ref.mult != null ? String(ref.mult) : '1.3',
      note: `참고: ${ref.source}${ref.rate == null ? ' · 비례율은 공개 전이라 확인된 구역 평균으로 채움' : ''}`,
    };
    setState((s) => ({ zones: [...s.zones, zone], activeId: id }));
    setView('detail');
  }

  const missing = activeZone ? makeMissingList(activeZone) : ['구역'];
  const result = activeZone && missing.length === 0 ? computeResult(activeZone) : null;

  return (
    <div className="shell">
      <header className="topbar">
        <button type="button" className="topbar__brand" onClick={() => setView('map')} aria-label="지도(홈)로 이동">
          <span className="wordmark">재개발 분석대장</span>
          <span className="topbar__tag">사업성 · 분담금 계산</span>
        </button>
        <div className="topbar__actions">
          <BackupControls zones={state.zones} onImportZones={importZones} />
          <button
            type="button"
            className="btn btn--quiet btn--sm topbar__theme"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            aria-pressed={theme === 'dark'}
          >
            {theme === 'dark' ? '밝은 화면으로' : '어두운 화면으로'}
          </button>
        </div>
      </header>

      <TopTabs view={view} onSetView={setView} />

      {view === 'detail' && (
        <ZoneRail
          zones={state.zones}
          activeId={activeZone?.id}
          onSelect={(id) => setViewAndSelect('detail', id)}
          onAdd={addZone}
          onRemove={removeZone}
        />
      )}

      <main className="container main">
        {view === 'map' ? (
          <MapView />
        ) : view === 'news' ? (
          <NewsPanel />
        ) : view === 'board' ? (
          <BoardPanel />
        ) : view === 'overview' ? (
          <ZoneOverview zones={state.zones} onPick={(id) => setViewAndSelect('detail', id)} />
        ) : view === 'reference' ? (
          <ReferencePanel onApply={createFromReference} />
        ) : (
          activeZone && (
            <>
              <div className="layout">
                <InputPanel zone={activeZone} onChange={updateZone} />
                <ResultPanel zone={activeZone} result={result} missing={missing} />
              </div>

              {result && (
                <div className="layout layout--scenarios">
                  <ScenarioTable
                    title="비례율 시나리오"
                    caption="비례율만 바꿨을 때의 결과입니다. 현재 입력값을 강조합니다."
                    rows={rateScenarios(activeZone)}
                    headLabel="비례율"
                    getHeadValue={(r) => `${r.rate.toFixed(0)}%`}
                    getHeadNote={(r) => (r.isCurrent ? '현재 입력값' : null)}
                  />
                  <ScenarioTable
                    title="감정평가 배율 시나리오"
                    caption="배율만 바꿨을 때의 결과입니다. 배율이 높을수록 분담금이 줄어듭니다."
                    rows={multScenarios(activeZone)}
                    headLabel="배율"
                    getHeadValue={(r) => `${r.mult.toFixed(2)}배`}
                    getHeadNote={(r) => (r.isCurrent ? '현재 입력값' : null)}
                  />
                </div>
              )}
            </>
          )
        )}

        {(view === 'detail' || view === 'overview') && (
          <footer className="note">
            <p>권리가액 = 감정평가액 × 비례율. 분담금 = 조합원 분양가 − 권리가액. 총투입금 = 매매가 + 분담금 + 기타비용.</p>
            <p>세금, 이주비 이자, 사업 지연 비용은 반영하지 않은 간이 계산입니다. 비례율과 확정 감정평가액은 관리처분계획(안)에서 바뀔 수 있습니다. 입력한 숫자는 이 기기에만 저장됩니다.</p>
          </footer>
        )}
      </main>
    </div>
  );
}
