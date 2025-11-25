-- Add constraints and indexes


--
-- Name: account_holders account_holders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_holders
    ADD CONSTRAINT account_holders_pkey PRIMARY KEY (id);


--
-- Name: bets bets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bets
    ADD CONSTRAINT bets_pkey PRIMARY KEY (id);


--
-- Name: betting_houses betting_houses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.betting_houses
    ADD CONSTRAINT betting_houses_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: surebet_sets surebet_sets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.surebet_sets
    ADD CONSTRAINT surebet_sets_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: idx_bets_surebet_set_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bets_surebet_set_id ON public.bets USING btree (surebet_set_id);


--
-- Name: idx_betting_houses_account_holder_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_betting_houses_account_holder_id ON public.betting_houses USING btree (account_holder_id);


--
-- Name: idx_surebet_sets_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_surebet_sets_created_at ON public.surebet_sets USING btree (created_at);


--
-- Name: idx_surebet_sets_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_surebet_sets_user_id ON public.surebet_sets USING btree (user_id);


--
-- Name: account_holders account_holders_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_holders
    ADD CONSTRAINT account_holders_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: bets bets_betting_house_id_betting_houses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bets
    ADD CONSTRAINT bets_betting_house_id_betting_houses_id_fk FOREIGN KEY (betting_house_id) REFERENCES public.betting_houses(id);


--
-- Name: bets bets_surebet_set_id_surebet_sets_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bets
    ADD CONSTRAINT bets_surebet_set_id_surebet_sets_id_fk FOREIGN KEY (surebet_set_id) REFERENCES public.surebet_sets(id);


--
-- Name: betting_houses betting_houses_account_holder_id_account_holders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.betting_houses
    ADD CONSTRAINT betting_houses_account_holder_id_account_holders_id_fk FOREIGN KEY (account_holder_id) REFERENCES public.account_holders(id);


--
-- Name: betting_houses betting_houses_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.betting_houses
    ADD CONSTRAINT betting_houses_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: surebet_sets surebet_sets_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.surebet_sets
    ADD CONSTRAINT surebet_sets_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict lxr1nbJz1dV6f2xUhhHbkgFDWjeEwX9j5CUYfoEeWIhj2Ng8AxErOnfLhFMVdYY

