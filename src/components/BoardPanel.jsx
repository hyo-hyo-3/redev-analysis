import { useEffect, useState } from 'react';
import { loadPosts, savePosts, makeId } from '../storage.js';

const PAGE_SIZE = 10;

function formatDate(iso) {
  return iso.slice(0, 10);
}

export default function BoardPanel() {
  const [posts, setPosts] = useState(loadPosts);
  const [mode, setMode] = useState('list');
  const [activeId, setActiveId] = useState(null);
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState({ title: '', author: '', content: '' });

  useEffect(() => {
    savePosts(posts);
  }, [posts]);

  const sorted = [...posts].sort((a, b) => (a.date < b.date ? 1 : -1));
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const activePost = posts.find((p) => p.id === activeId);

  function startWrite() {
    setDraft({ title: '', author: '', content: '' });
    setMode('write');
  }

  function submitPost(e) {
    e.preventDefault();
    if (!draft.title.trim() || !draft.content.trim()) return;
    const post = {
      id: makeId(),
      title: draft.title.trim(),
      author: draft.author.trim() || '익명',
      content: draft.content.trim(),
      date: new Date().toISOString(),
    };
    setPosts((p) => [post, ...p]);
    setMode('list');
  }

  function openPost(id) {
    setActiveId(id);
    setMode('detail');
  }

  function deletePost(id) {
    setPosts((p) => p.filter((x) => x.id !== id));
    setMode('list');
  }

  if (mode === 'write') {
    return (
      <section className="panel board">
        <header className="scenario__head">
          <h3>새 글쓰기</h3>
        </header>
        <form className="board__form" onSubmit={submitPost}>
          <div className="field">
            <label htmlFor="b-title">제목</label>
            <div className="field__row">
              <input
                id="b-title"
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                required
              />
            </div>
            <p className="field__help" />
          </div>
          <div className="field">
            <label htmlFor="b-author">글쓴이 (선택)</label>
            <div className="field__row">
              <input
                id="b-author"
                value={draft.author}
                placeholder="비워 두면 익명"
                onChange={(e) => setDraft((d) => ({ ...d, author: e.target.value }))}
              />
            </div>
            <p className="field__help" />
          </div>
          <div className="field">
            <label htmlFor="b-content">내용</label>
            <textarea
              id="b-content"
              className="board__textarea"
              rows={10}
              value={draft.content}
              onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
              required
            />
          </div>
          <div className="board__actions">
            <button type="button" className="btn btn--quiet btn--sm" onClick={() => setMode('list')}>
              취소
            </button>
            <button type="submit" className="btn btn--sm">
              등록
            </button>
          </div>
        </form>
      </section>
    );
  }

  if (mode === 'detail' && activePost) {
    return (
      <section className="panel board">
        <header className="scenario__head">
          <h3>{activePost.title}</h3>
          <p className="scenario__caption">
            {activePost.author} · {formatDate(activePost.date)}
          </p>
        </header>
        <p className="board__content">{activePost.content}</p>
        <div className="board__actions">
          <button type="button" className="btn btn--quiet btn--sm" onClick={() => setMode('list')}>
            목록으로
          </button>
          <button type="button" className="btn btn--quiet btn--danger btn--sm" onClick={() => deletePost(activePost.id)}>
            삭제
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="panel board">
      <header className="scenario__head">
        <h3>자유게시판</h3>
        <p className="scenario__caption">
          이 기기에만 저장됩니다. 다른 기기나 다른 사람과는 아직 공유되지 않습니다.
        </p>
      </header>

      <div className="board__toolbar">
        <button type="button" className="btn btn--sm" onClick={startWrite}>
          새 글쓰기
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="board__empty">아직 작성된 글이 없습니다. 첫 글을 남겨보세요.</p>
      ) : (
        <ul className="board__list">
          {pageItems.map((p) => (
            <li key={p.id} className="board__item">
              <button type="button" className="board__itemButton" onClick={() => openPost(p.id)}>
                <h4>{p.title}</h4>
                <p className="board__excerpt">{p.content.slice(0, 80)}</p>
                <p className="news__source">
                  {p.author} · {formatDate(p.date)}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {pageCount > 1 && (
        <nav className="pager" aria-label="자유게시판 페이지">
          <button
            type="button"
            className="btn btn--quiet btn--sm"
            onClick={() => setPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
          >
            이전
          </button>
          <span className="pager__status">
            {currentPage} / {pageCount} 페이지 · {sorted.length}건
          </span>
          <button
            type="button"
            className="btn btn--quiet btn--sm"
            onClick={() => setPage(Math.min(pageCount, currentPage + 1))}
            disabled={currentPage >= pageCount}
          >
            다음
          </button>
        </nav>
      )}
    </section>
  );
}
