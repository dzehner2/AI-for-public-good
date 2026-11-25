-- The interview gained three goals (money, wellbeing, making by hand). Allow up to 20.
alter table public.skill_interviews drop constraint if exists skill_interviews_goals_check;
alter table public.skill_interviews add constraint skill_interviews_goals_check check (cardinality(goals) <= 20);
