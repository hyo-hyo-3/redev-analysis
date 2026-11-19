import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.js';

const PAGE_SIZE = 10;

function formatDate(iso) {
  return iso.slice(0, 10);
}

export default function BoardPanel() {
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState('loading');
  const [mode, setMode] = useState('list');
  const [activeId, setActiveId] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentStatus, setCommentStatus] = useState('idle');
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState({ title: '', author: '', content: '' });
  const [commentDraft, setCommentDraft] = useState({ author: '', content: '' });

  useEffect(() => {
    if (!supabase) {
      setStatus('unconfigured');
      return;
    }
    let cancelled = false;
    supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setStatus('error');
          return;
        }
        setPosts(data ?? []);
        setStatus('ready');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function loadComments(postId) {
    setCommentStatus('loading');
    supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          setCommentStatus('error');
          return;
        }
        setComments(data ?? []);
        setCommentStatus('ready');
      });
  }

  const pageCount = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = posts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const activePost = posts.find((p) => p.id === activeId);

  function startWrite() {
    setDraft({ title: '', author: '', content: '' });
    setMode('write');
  }

  async function submitPost(e) {
    e.preventDefault();
    if (!draft.title.trim() || !draft.content.trim()) return;
    const { data, error } = await supabase
      .from('posts')
      .insert({
        title: draft.title.trim(),
        author: draft.author.trim() || '익명',
        content: draft.content.trim(),
      })
      .select()
      .single();
    if (error) {
      window.alert('등록에 실패했습니다: ' + error.message);
      return;
    }
    setPosts((p) => [data, ...p]);
    setMode('list');
  }

  function openPost(id) {
    setActiveId(id);
    setMode('detail');
    setCommentDraft({ author: '', content: '' });
    loadComments(id);
  }

  async function submitComment(e) {
    e.preventDefault();
    if (!commentDraft.content.trim()) return;
    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: activeId,
        author: commentDraft.author.trim() || '익명',
        content: commentDraft.content.trim(),
      })
      .select()
      .single();
    if (error) {
      window.alert('댓글 등록에 실패했습니다: ' + error.message);
      return;
    }
    setComments((c) => [...c, data]);
    setCommentDraft({ author: '', content: '' });
  }

  if (status === 'unconfigured') {
    return (
      <section className="panel board">
        <header className="scenario__head">
          <h3>재개발 토론장</h3>
        </header>
        <p className="board__empty">아직 게시판 연결 설정(.env의 Supabase 주소·키)이 안 되어 있습니다.</p>
      </section>
    );
  }

  if (status === 'loading') {
    return (
      <section className="panel board">
        <header className="scenario__head">
          <h3>재개발 토론장</h3>
        </header>
        <p className="board__empty">글을 불러오는 중입니다…</p>
      </section>
    );
  }

  if (status === 'error') {
    return (
      <section className="panel board">
        <header className="scenario__head">
          <h3>재개발 토론장</h3>
        </header>
        <p className="board__empty">
          글을 불러오지 못했습니다. sql/board_schema.sql을 Supabase SQL Editor에서 먼저 실행했는지 확인해주세요.
        </p>
      </section>
    );
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
            {activePost.author} · {formatDate(activePost.created_at)}
          </p>
        </header>
        <p className="board__content">{activePost.content}</p>
        <div className="board__actions">
          <button type="button" className="btn btn--quiet btn--sm" onClick={() => setMode('list')}>
            목록으로
          </button>
        </div>

        <div className="board__comments">
          <h4 className="board__commentsTitle">
            댓글 {commentStatus === 'ready' ? comments.length : ''}
          </h4>
          {commentStatus === 'loading' && <p className="board__empty">댓글을 불러오는 중입니다…</p>}
          {commentStatus === 'error' && <p className="board__empty">댓글을 불러오지 못했습니다.</p>}
          {commentStatus === 'ready' && comments.length === 0 && (
            <p className="board__empty">아직 댓글이 없습니다. 첫 댓글을 남겨보세요.</p>
          )}
          {commentStatus === 'ready' && comments.length > 0 && (
            <ul className="board__commentList">
              {comments.map((c) => (
                <li key={c.id} className="board__comment">
                  <p className="board__commentMeta">
                    {c.author} · {formatDate(c.created_at)}
                  </p>
                  <p className="board__commentContent">{c.content}</p>
                </li>
              ))}
            </ul>
          )}

          <form className="board__commentForm" onSubmit={submitComment}>
            <div className="field__row">
              <input
                value={commentDraft.author}
                placeholder="글쓴이 (선택, 비워 두면 익명)"
                onChange={(e) => setCommentDraft((d) => ({ ...d, author: e.target.value }))}
              />
            </div>
            <div className="field__row">
              <input
                value={commentDraft.content}
                placeholder="댓글을 입력하세요"
                onChange={(e) => setCommentDraft((d) => ({ ...d, content: e.target.value }))}
                required
              />
              <button type="submit" className="btn btn--sm">
                등록
              </button>
            </div>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="panel board">
      <header className="scenario__head">
        <h3>재개발 토론장</h3>
        <p className="scenario__caption">구역 정보나 사업성에 대한 생각을 나누는 곳입니다. 누구나 읽고 쓸 수 있습니다.</p>
      </header>

      <div className="board__toolbar">
        <button type="button" className="btn btn--sm" onClick={startWrite}>
          새 글쓰기
        </button>
      </div>

      {posts.length === 0 ? (
        <p className="board__empty">아직 작성된 글이 없습니다. 첫 글을 남겨보세요.</p>
      ) : (
        <ul className="board__list">
          {pageItems.map((p) => (
            <li key={p.id} className="board__item">
              <button type="button" className="board__itemButton" onClick={() => openPost(p.id)}>
                <h4>{p.title}</h4>
                <p className="board__excerpt">{p.content.slice(0, 80)}</p>
                <p className="news__source">
                  {p.author} · {formatDate(p.created_at)}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {pageCount > 1 && (
        <nav className="pager" aria-label="재개발 토론장 페이지">
          <button
            type="button"
            className="btn btn--quiet btn--sm"
            onClick={() => setPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
          >
            이전
          </button>
          <span className="pager__status">
            {currentPage} / {pageCount} 페이지 · {posts.length}건
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
