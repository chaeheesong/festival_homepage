-- 구글 시트 연동용: 신청 내역 "읽기 전용" 함수 + 전용 토큰
-- Supabase → SQL Editor → New query 에 이 파일 내용을 통째로 붙여 넣고 Run
-- (여러 번 실행해도 괜찮습니다. 토큰은 처음 한 번만 만들어집니다.)

-- 1) 토큰 저장소: API로 노출되지 않는 private 스키마
create schema if not exists private;
revoke all on schema private from anon, authenticated;

create table if not exists private.export_token (
  token text primary key
);
alter table private.export_token enable row level security;

-- 토큰이 없을 때만 새로 만듦 (64자리 무작위 값)
insert into private.export_token (token)
select replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
where not exists (select 1 from private.export_token);

-- 2) 읽기 전용 함수: 올바른 토큰일 때만 해당 프로그램 뷰의 내용을 돌려줌
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
    when 'song'    then (select coalesce(json_agg(v order by v."신청일시"), '[]'::json) from public."신청_용연가요제" v)
    when 'runner'  then (select coalesce(json_agg(v order by v."신청일시"), '[]'::json) from public."신청_드래곤러너" v)
    when 'stamp'   then (select coalesce(json_agg(v order by v."신청일시"), '[]'::json) from public."신청_드래곤볼" v)
    else null
  end;
end;
$$;

revoke all on function public.export_applications(text, text) from public;
grant execute on function public.export_applications(text, text) to anon;

-- 3) 구글 시트에 넣을 토큰 확인 (아래 결과의 token 값을 복사)
select token from private.export_token;
