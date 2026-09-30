-- 찾아가는 버스킹(busking) 신청 받기
-- Supabase → SQL Editor → New query 에 통째로 붙여 넣고 Run (여러 번 실행해도 괜찮습니다)
-- 1-supabase-export.sql 을 이미 실행한 뒤에 실행하세요

-- 1) 신청 테이블이 busking 을 받도록 허용 목록에 추가
alter table public.applications drop constraint if exists applications_program_check;
alter table public.applications
  add constraint applications_program_check
  check (program in ('walk', 'culture', 'busking', 'song', 'runner', 'stamp'));

-- 2) 대시보드·구글 시트용 한글 칸 뷰
create or replace view public."신청_찾아가는버스킹" with (security_invoker = true) as
select
  created_at at time zone 'Asia/Seoul' as "신청일시",
  answers->>'team'  as "팀명",
  answers->>'name'  as "대표자",
  answers->>'tel'   as "연락처",
  answers->>'area'  as "활동지역",
  answers->>'count' as "참가인원",
  case when answers->>'genre' = '기타' then '기타: ' || coalesce(answers->>'genreEtc', '') else answers->>'genre' end as "공연장르",
  answers->>'content' as "공연내용",
  coalesce(nullif(answers->>'video', ''), case when (answers->>'videoEmail')::boolean then '이메일로 제출 예정' end) as "공연영상",
  answers->>'intro' as "팀 소개",
  case when agree_photo then '동의' else '미동의' end as "사진 활용 동의"
from public.applications
where program = 'busking'
order by created_at;

revoke all on public."신청_찾아가는버스킹" from anon, authenticated;

-- 3) 구글 시트 연동 함수에 busking 추가
create or replace function public.export_applications(p_token text, p_program text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_token is null or not exists (select 1 from private.export_token t where t.token = p_token) then
    raise exception 'invalid token' using errcode = '42501';
  end if;

  return case p_program
    when 'walk'    then (select coalesce(json_agg(v order by v."신청일시"), '[]'::json) from public."신청_용의산책" v)
    when 'culture' then (select coalesce(json_agg(v order by v."신청일시"), '[]'::json) from public."신청_문화의물결" v)
    when 'busking' then (select coalesce(json_agg(v order by v."신청일시"), '[]'::json) from public."신청_찾아가는버스킹" v)
    when 'song'    then (select coalesce(json_agg(v order by v."신청일시"), '[]'::json) from public."신청_용연가요제" v)
    when 'runner'  then (select coalesce(json_agg(v order by v."신청일시"), '[]'::json) from public."신청_드래곤러너" v)
    when 'stamp'   then (select coalesce(json_agg(v order by v."신청일시"), '[]'::json) from public."신청_드래곤볼" v)
    else null
  end;
end;
$$;

revoke all on function public.export_applications(text, text) from public;
grant execute on function public.export_applications(text, text) to anon;
