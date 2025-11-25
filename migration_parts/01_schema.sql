--
-- PostgreSQL database dump
--


-- Dumped from database version 16.9 (415ebe8)
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.surebet_sets DROP CONSTRAINT IF EXISTS surebet_sets_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.betting_houses DROP CONSTRAINT IF EXISTS betting_houses_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.betting_houses DROP CONSTRAINT IF EXISTS betting_houses_account_holder_id_account_holders_id_fk;
ALTER TABLE IF EXISTS ONLY public.bets DROP CONSTRAINT IF EXISTS bets_surebet_set_id_surebet_sets_id_fk;
ALTER TABLE IF EXISTS ONLY public.bets DROP CONSTRAINT IF EXISTS bets_betting_house_id_betting_houses_id_fk;
ALTER TABLE IF EXISTS ONLY public.account_holders DROP CONSTRAINT IF EXISTS account_holders_user_id_users_id_fk;
DROP INDEX IF EXISTS public.idx_surebet_sets_user_id;
DROP INDEX IF EXISTS public.idx_surebet_sets_created_at;
DROP INDEX IF EXISTS public.idx_betting_houses_account_holder_id;
DROP INDEX IF EXISTS public.idx_bets_surebet_set_id;
DROP INDEX IF EXISTS public."IDX_session_expire";
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_unique;
ALTER TABLE IF EXISTS ONLY public.surebet_sets DROP CONSTRAINT IF EXISTS surebet_sets_pkey;
ALTER TABLE IF EXISTS ONLY public.session DROP CONSTRAINT IF EXISTS session_pkey;
ALTER TABLE IF EXISTS ONLY public.betting_houses DROP CONSTRAINT IF EXISTS betting_houses_pkey;
ALTER TABLE IF EXISTS ONLY public.bets DROP CONSTRAINT IF EXISTS bets_pkey;
ALTER TABLE IF EXISTS ONLY public.account_holders DROP CONSTRAINT IF EXISTS account_holders_pkey;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.surebet_sets;
DROP TABLE IF EXISTS public.session;
DROP TABLE IF EXISTS public.betting_houses;
DROP TABLE IF EXISTS public.bets;
DROP TABLE IF EXISTS public.account_holders;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account_holders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_holders (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying,
    name text NOT NULL,
    email text,
    username text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: bets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bets (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    surebet_set_id character varying,
    betting_house_id character varying,
    bet_type text NOT NULL,
    odd numeric(8,3) NOT NULL,
    stake numeric(10,2) NOT NULL,
    potential_profit numeric(10,2) NOT NULL,
    result text,
    actual_profit numeric(10,2),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: betting_houses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.betting_houses (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying,
    name text NOT NULL,
    notes text,
    account_holder_id character varying,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


--
-- Name: surebet_sets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.surebet_sets (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying,
    event_date timestamp without time zone,
    sport text,
    league text,
    team_a text,
    team_b text,
    profit_percentage numeric(5,2),
    status text DEFAULT 'pending'::text,
    is_checked boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    role text DEFAULT 'user'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Data for Name: account_holders; Type: TABLE DATA; Schema: public; Owner: -
--

