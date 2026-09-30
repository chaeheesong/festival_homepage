-- 용의 산책 인원 제한: 희망 행렬 노선(용담1동 / 용담2동)별 참가인원 합계 35명까지
-- Supabase → SQL Editor → New query 에 통째로 붙여 넣고 Run (여러 번 실행해도 괜찮습니다)
-- 인원을 바꾸려면 아래 walk_capacity() 의 35 를 고친 뒤 다시 Run

create schema if not exists private;
revoke all on schema private from anon, authenticated;

-- 노선별 정원
create or replace function private.walk_capacity()
returns int language sql immutable as $$ select 35 $$;

-- 신청 1건의 참가인원 (본인 포함, 숫자만 추출 / 없으면 1명)
create or replace function private.walk_people(answers jsonb)
returns int language sql immutable as $$
  select greatest(1, coalesce(nullif(regexp_replace(coalesce(answers->>'count', ''), '\D', '', 'g'), '')::int, 1))
$$;

-- 노선별 신청 합계
create or replace function private.walk_used(p_line text)
returns int language sql stable security definer set search_path = '' as $$
  select coalesce(sum(private.walk_people(a.answers)), 0)::int
  from public.applications a
  where a.program = 'walk' and a.answers->>'line' = p_line
$$;

-- 홈페이지에서 남은 자리 조회 (숫자만 공개): {"용담1동": 12, "용담2동": 35}
create or replace function public.walk_remaining()
returns json language sql stable security definer set search_path = '' as $$
  select json_build_object(
    '용담1동', greatest(0, private.walk_capacity() - private.walk_used('용담1동')),
    '용담2동', greatest(0, private.walk_capacity() - private.walk_used('용담2동'))
  )
$$;
revoke all on function public.walk_remaining() from public;
grant execute on function public.walk_remaining() to anon, authenticated;

-- 저장 직전 검사: 정원을 넘기면 거부 (동시에 들어온 신청은 한 건씩 차례로 처리)
create or replace function private.check_walk_capacity()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_line text := new.answers->>'line';
  v_people int := private.walk_people(new.answers);
  v_left int;
begin
  if new.program <> 'walk' then
    return new;
  end if;
  if v_line is null or v_line not in ('용담1동', '용담2동') then
    raise exception 'walk_invalid_line' using errcode = 'P0001';
  end if;
  perform pg_advisory_xact_lock(hashtext('walk_capacity:' || v_line));
  v_left := private.walk_capacity() - private.walk_used(v_line);
  if v_people > v_left then
    raise exception 'walk_capacity_exceeded' using errcode = 'P0001', detail = 'remaining=' || greatest(v_left, 0);
  end if;
  return new;
end;
$$;

drop trigger if exists check_walk_capacity on public.applications;
create trigger check_walk_capacity
  before insert on public.applications
  for each row execute function private.check_walk_capacity();

-- 확인: 현재 남은 자리
select public.walk_remaining();
