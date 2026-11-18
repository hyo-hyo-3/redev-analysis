import { useRef, useState } from 'react';
import { makeId } from '../storage.js';

function todayStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function BackupControls({ zones, onImportZones }) {
  const fileInputRef = useRef(null);
  const [status, setStatus] = useState('');

  function showStatus(text) {
    setStatus(text);
    window.setTimeout(() => setStatus(''), 4000);
  }

  function handleExport() {
    const payload = { zones, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `재개발-분석대장-백업-${todayStamp()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showStatus('파일로 내보냈습니다.');
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (!Array.isArray(data.zones)) throw new Error('invalid');
        const imported = data.zones.map((z) => ({ ...z, id: makeId() }));
        onImportZones(imported);
        showStatus(`구역 ${imported.length}곳을 불러왔습니다.`);
      } catch {
        showStatus('파일을 읽지 못했습니다. 이 화면에서 내보낸 백업 파일인지 확인하세요.');
      }
    };
    reader.onerror = () => showStatus('파일을 읽지 못했습니다.');
    reader.readAsText(file);
  }

  return (
    <div className="backup">
      <button type="button" className="btn btn--quiet btn--sm" onClick={handleExport}>
        내보내기
      </button>
      <button type="button" className="btn btn--quiet btn--sm" onClick={handleImportClick}>
        가져오기
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="visually-hidden"
        onChange={handleFileChange}
        aria-label="백업 파일 가져오기"
      />
      <p className="backup__status" role="status" aria-live="polite">
        {status}
      </p>
    </div>
  );
}
