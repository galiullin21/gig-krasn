-- Изменяем тип issue_number с integer на text для поддержки двойных номеров типа "1-2"
ALTER TABLE public.newspaper_archive 
ALTER COLUMN issue_number TYPE text USING issue_number::text;