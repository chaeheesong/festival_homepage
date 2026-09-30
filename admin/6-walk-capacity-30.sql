-- 용의 산책 노선별 정원 35명 → 30명
-- Supabase → SQL Editor → New query 에 붙여 넣고 Run
create or replace function private.walk_capacity()
returns int language sql immutable as $$ select 30 $$;

-- 확인: 남은 자리 (신청이 없으면 {"용담1동" : 30, "용담2동" : 30})
select public.walk_remaining();
