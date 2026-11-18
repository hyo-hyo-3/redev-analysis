const TABS = [
  ['detail', '계산기'],
  ['overview', '내 구역 비교'],
  ['reference', '전체 구역'],
  ['news', '재개발 소식'],
];

export default function TopTabs({ view, onSetView }) {
  return (
    <nav className="top-tabs" aria-label="주요 화면">
      <ul>
        {TABS.map(([key, label]) => (
          <li key={key}>
            <button
              type="button"
              className="top-tabs__tab"
              aria-current={view === key ? 'true' : undefined}
              onClick={() => onSetView(key)}
            >
              {label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
