-- 찾아라 드래곤볼 온라인 사전접수: 참가인원 합계 150명까지
-- Supabase → SQL Editor → New query 에 통째로 붙여 넣고 Run (여러 번 실행해도 괜찮습니다)
-- 3-walk-capacity.sql 을 실행한 뒤에 실행하세요 (private.walk_people 을 함께 씁니다)
-- 인원을 바꾸려면 stamp_capacity() 의 150 을 고친 뒤 다시 Run

create or replace function private.stamp_capacity()
returns int language sql immutable as $$ select 150 $$;

-- 신청 합계 (신청 1건의 참가인원은 answers.count, 없으면 1명)
create or replace function private.stamp_used()
returns int language sql stable security definer set search_path = '' as $$
  select coalesce(sum(private.walk_people(a.answers)), 0)::int
  from public.applications a
  where a.program = 'stamp'
$$;

-- 홈페이지에서 남은 자리 조회: {"전체": 42}
create or replace function public.stamp_remaining()
returns json language sql stable security definer set search_path = '' as $$
  select json_build_object('전체', greatest(0, private.stamp_capacity() - private.stamp_used()))
$$;
revoke all on function public.stamp_remaining() from public;
grant execute on function public.stamp_remaining() to anon, authenticated;

-- 저장 직전 검사: 정원을 넘기면 거부 (동시에 들어온 신청은 한 건씩 차례로 처리)
create or replace function private.check_stamp_capacity()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_left int;
begin
  if new.program <> 'stamp' then
    return new;
  end if;
  perform pg_advisory_xact_lock(hashtext('stamp_capacity'));
  v_left := private.stamp_capacity() - private.stamp_used();
  if private.walk_people(new.answers) > v_left then
    raise exception 'stamp_capacity_exceeded' using errcode = 'P0001', detail = 'remaining=' || greatest(v_left, 0);
  end if;
  return new;
end;
$$;

drop trigger if exists check_stamp_capacity on public.applications;
create trigger check_stamp_capacity
  before insert on public.applications
  for each row execute function private.check_stamp_capacity();

-- 확인: 남은 자리
select public.stamp_remaining();
