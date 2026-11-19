-- 재개발 토론장(게시판) 테이블. Supabase 대시보드 > SQL Editor에 붙여넣고 실행하세요.
-- 공개 게시판: 누구나 읽고 쓸 수 있고, 삭제는 막아 뒀습니다(관리자 콘솔에서만 지울 수 있음).

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null default '익명',
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  author text not null default '익명',
  content text not null,
  created_at timestamptz not null default now()
);

alter table posts enable row level security;
alter table comments enable row level security;

create policy "누구나 글 읽기" on posts for select using (true);
create policy "누구나 글 쓰기" on posts for insert with check (true);

create policy "누구나 댓글 읽기" on comments for select using (true);
create policy "누구나 댓글 쓰기" on comments for insert with check (true);
