import { useEffect, useMemo, useState } from 'react';
import ZoneRail from './components/ZoneRail.jsx';
import InputPanel from './components/InputPanel.jsx';
import ResultPanel from './components/ResultPanel.jsx';
import ScenarioTable from './components/ScenarioTable.jsx';
import { loadZones, saveZones, emptyZone, makeId } from './storage.js';
import { computeResult, rateScenarios, multScenarios, toNum } from './calc.js';

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
    return { zones: [emptyZone(id)], activeId: id };
  });

  useEffect(() => {
    saveZones(state);
  }, [state]);

  const activeZone = useMemo(
    () => state.zones.find((z) => z.id === state.activeId) || state.zones[0],
    [state],
  );

  function updateZone(next) {
    setState((s) => ({ ...s, zones: s.zones.map((z) => (z.id === next.id ? next : z)) }));
  }

  function addZone() {
    const id = makeId();
    setState((s) => ({ zones: [...s.zones, emptyZone(id)], activeId: id }));
  }

  function removeZone(id) {
    setState((s) => {
      const zones = s.zones.filter((z) => z.id !== id);
      if (zones.length === 0) {
        const newId = makeId();
        return { zones: [emptyZone(newId)], activeId: newId };
      }
      const activeId = s.activeId === id ? zones[0].id : s.activeId;
      return { zones, activeId };
    });
  }

  function selectZone(id) {
    setState((s) => ({ ...s, activeId: id }));
  }

  const missing = activeZone ? makeMissingList(activeZone) : ['구역'];
  const result = activeZone && missing.length === 0 ? computeResult(activeZone) : null;

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar__brand">
          <span className="wordmark">재개발 분석대장</span>
          <span className="topbar__tag">사업성 · 분담금 계산</span>
        </div>
      </header>

      <ZoneRail
        zones={state.zones}
        activeId={activeZone?.id}
        onSelect={selectZone}
        onAdd={addZone}
        onRemove={removeZone}
      />

      <main className="container main">
        {activeZone && (
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
        )}

        <footer className="note">
          <p>권리가액 = 감정평가액 × 비례율. 분담금 = 조합원 분양가 − 권리가액. 총투입금 = 매매가 + 분담금 + 기타비용.</p>
          <p>세금, 이주비 이자, 사업 지연 비용은 반영하지 않은 간이 계산입니다. 비례율과 확정 감정평가액은 관리처분계획(안)에서 바뀔 수 있습니다. 입력한 숫자는 이 기기에만 저장됩니다.</p>
        </footer>
      </main>
    </div>
  );
}
