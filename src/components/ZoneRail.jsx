export default function ZoneRail({ zones, activeId, onSelect, onAdd, onRemove, view, onSetView }) {
  const inDetail = view === 'detail';
  return (
    <div className="rail-bar">
      <ul className="rail" aria-label="등록된 구역">
        {zones.map((z) => (
          <li key={z.id}>
            <button
              type="button"
              className="rail__chip"
              aria-current={z.id === activeId && inDetail ? 'true' : undefined}
              onClick={() => onSetView('detail', z.id)}
            >
              {z.name || '이름 없는 구역'}
            </button>
          </li>
        ))}
      </ul>
      <div className="rail-bar__actions">
        {inDetail ? (
          <>
            <button type="button" className="btn btn--quiet btn--sm" onClick={() => onSetView('overview')}>
              전체 구역 보기
            </button>
            <button type="button" className="btn btn--quiet btn--sm" onClick={() => onSetView('reference')}>
              참고 구역
            </button>
            {zones.length > 0 && (
              <button type="button" className="btn btn--quiet btn--danger btn--sm" onClick={() => onRemove(activeId)}>
                이 구역 삭제
              </button>
            )}
          </>
        ) : (
          <button type="button" className="btn btn--quiet btn--sm" onClick={() => onSetView('detail')}>
            구역 보기
          </button>
        )}
        <button type="button" className="btn btn--sm" onClick={onAdd}>
          새 구역
        </button>
      </div>
    </div>
  );
}
