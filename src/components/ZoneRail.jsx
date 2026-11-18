export default function ZoneRail({ zones, activeId, onSelect, onAdd, onRemove, view, onToggleView }) {
  return (
    <div className="rail-bar">
      <ul className="rail" aria-label="등록된 구역">
        {zones.map((z) => (
          <li key={z.id}>
            <button
              type="button"
              className="rail__chip"
              aria-current={z.id === activeId ? 'true' : undefined}
              onClick={() => onSelect(z.id)}
            >
              {z.name || '이름 없는 구역'}
            </button>
          </li>
        ))}
      </ul>
      <div className="rail-bar__actions">
        <button
          type="button"
          className="btn btn--quiet btn--sm"
          aria-pressed={view === 'overview'}
          onClick={onToggleView}
        >
          {view === 'overview' ? '구역 보기' : '전체 구역 보기'}
        </button>
        {view !== 'overview' && zones.length > 0 && (
          <button type="button" className="btn btn--quiet btn--danger btn--sm" onClick={() => onRemove(activeId)}>
            이 구역 삭제
          </button>
        )}
        <button type="button" className="btn btn--sm" onClick={onAdd}>
          새 구역
        </button>
      </div>
    </div>
  );
}
