-- Força recarregar o cache do PostgREST quando aplicado
select pg_notify('pgrst', 'reload schema');
