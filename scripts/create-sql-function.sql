-- Create a function to execute raw SQL queries
-- This needs to be run in your Supabase SQL editor first
create or replace function execute_sql(sql text)
returns json
language plpgsql
security definer
as $$
begin
  execute sql;
  return json_build_object('success', true);
exception when others then
  return json_build_object(
    'success', false,
    'error', SQLERRM,
    'sqlstate', SQLSTATE
  );
end;
$$;
