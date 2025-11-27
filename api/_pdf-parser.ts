import pdfParse from 'pdf-parse';

export const CASAS_SISTEMA = [
  '10Bet', '10Bet (SE)', '10Bet (ZA)', '10Bet (UK)', '10Bet (MX)', '888Games', '10Cric', '188Bet',
  '188Bet (PT)', '188Bet (Sbk)', '188Bet (ZH)', 'HGA030 (Crown)', 'HGA035 (Crown)', '18Bet', 'BabiBet',
  'Hollywoodbets (UK)', 'Premium Tradings', 'RoyalistPlay', 'RoyalistPlay (Bet)', '1Bet (CO)', '21Red',
  'Bet-Bra SB (BR)', 'BetOBet', 'BetOBet (CC)', 'Dazzlehand', 'FoggyBet', 'OneCasino', 'Scarawins',
  '1Win (Original)', '1xBet', '1xBet (AG)', '1xBet (BO)', '1xBet (MD)', '1xBet (NG)', '1xstavka (RU)',
  'Betandyou', 'Linebet', 'MegaPari', 'Oppa88', 'Pari-pesa', 'Paripesa', 'Paripesa (Asia)', 'Paripesa (Biz)',
  'Paripesa (Com)', 'Paripesa (Cool)', 'Paripesa (ME)', 'Paripesa (Net)', 'Paripesa (NG)', 'Paripesa (PT)',
  'Paripesa (Site)', 'Paripesaut', 'SapphireBet', '1xBet (ES)', '1xBet (IT)', 'Fastbet (IT)', '22Bet',
  '22Bet (CM)', '22Bet (NG)', '22win88', 'Bestwinzz', '32Red', 'Unibet (EE)', 'Unibet (IE)', 'Unibet (UK)',
  '3et', '888sport', '888sport (DE)', '888sport (DK)', '888sport (ES)', '888sport (RO)', 'MrGreen',
  'MrGreen (DK)', 'MrGreen (SE)', '888sport (IT)', 'AccessBet', 'AdjaraBet', 'Admiral (AT)', 'Admiral (DE)',
  'AdmiralBet (ES)', 'AdmiralCasino (UK)', 'Swisslos (CH)', 'AdmiralBet (IT)', 'Afribet (NG)', 'Betfred (ZA)',
  'AI Sports', 'AirBet (IT)', 'AndromedaBet (IT)', 'BetItaly (IT)', 'Akbets', 'AlfaBet (BR)', 'Aposta1 (BR)',
  'Apostaganha (BR)', 'ArtlineBet', 'AsianOdds', 'B1Bet (BR)', 'Bahigo', 'Kakeyo', 'BaltBet (RU)',
  'BandBet (BR)', 'BangBet', 'Betsure', 'BantuBet (AO)', 'Bet2U2', 'BetBaba (NG)', 'Bet-at-home',
  'Bet-at-home (DE)', 'Bet-Bra (BR)', 'Bet25 (DK)', 'Bet3000 (DE)', 'Bet365 (Fast)', '28365365', '365-808',
  '365sb', '365sport365', '878365', 'Allsport365', 'Bet365 (AU)', 'Bet365 (BR)', 'Bet365 (DE)', 'Bet365 (ES)',
  'Bet365 (GR)', 'Bet365 (IT)', 'Bet365 (NL)', 'Game-365 (CN)', 'Bet365 (Full)', 'Bet4 (BR)', 'Bet4',
  'Bet4 (PE)', 'Bet7', 'Bet7k (BR)', 'B2XBET (BR)', 'BetBet (BR)', 'Cassino (BR)', 'Donald (BR)', 'Vera (BR)',
  'Bet9ja', 'Betadonis', 'Betaland (IT)', 'Betano', 'Betano (CZ)', 'Betano (DE)', 'Betano (MX)', 'Betano (NG)',
  'Betano (RO)', 'Betano (BR)', 'Betano (PT)', 'Betao (BR)', 'BravoBet (BR)', 'Maxima (BR)', 'R7Bet (BR)',
  'XpBet (BR)', 'BetBoom (BR)', 'BetBoom', 'BetBoom (RU)', 'Betboro', 'Betboro (GH)', 'Betcity',
  'Betcity (BY)', 'Betcity (Net)', 'Betcity (RU)', 'Formula55 (TJ)', 'Betcity (NL)', 'SpeedyBet', 'BetClic',
  'BetClic (FR)', 'BetClic (IT)', 'BetClic (PL)', 'BetClic (PT)', 'Betcris', 'Betcris (DO)', 'Betcris (MX)',
  'Betcris (PL)', 'BetDaq', 'BetDaSorte (BR)', 'Afun (BR)', 'BetDSI (EU)', 'BetEsporte (BR)', 'LanceDeSorte (BR)',
  'Betfair', 'Betfair (AU)', 'Betfair (BR)', 'Betfair (RO)', 'SatSport', 'Sharpxch', 'Tradexbr',
  'Betfair (ES)', 'Betfair (IT)', 'Betfair (MBR)', 'Betfair SB', 'Betfair SB (ES)', 'Betfair SB (RO)',
  'Betfarm', 'Betfirst (BE)', 'Betflip', 'Casobet (Sport)', 'Fairspin', 'Tether', 'Betfred', 'BetiBet',
  'Betika (KE)', 'BetInAsia (Black)', 'Betinia', 'CampoBet', 'Lottoland (UK)', 'BetKing', 'Betlive',
  'Betmaster', 'BetMomo', 'Betnacional (BR)', 'Betnation (NL)', 'BetOnline (AG)', 'BetOnline (Classic)',
  'LowVig (AG)', 'SportsBetting (AG)', 'TigerGaming', 'BetPawa (NG)', 'BetPawa (CM)', 'BetPawa (GH)',
  'BetPawa (KE)', 'BetPawa (RW)', 'BetPawa (TZ)', 'BetPawa (UG)', 'BetPawa (ZM)', 'BetPix365 (BR)',
  'Vaidebet', 'BetRebels', '21Bets', '7bet (LT)', 'All British Casino', 'ApuestaTotal', 'Bankonbet',
  'BaumBet (RO)', 'Bet593 (EC)', 'Betaki (BR)', 'Betanoshops (NG)', 'Betinia (DK)', 'Betinia (SE)',
  'BetNFlix', 'Bettarget (UK)', 'CampeonBet', 'Casinado', 'CasinoAtlanticCity', 'Casinoly', 'Cazimbo',
  'DoradoBet', 'Ecuabet', 'ElaBet (GR)', 'EsportivaBet (BR)', 'EstrelaBet (BR)', 'EvoBet', 'FezBet',
  'FrankSports (RO)', 'GastonRed', 'Golden Palace (BE)', 'Greatwin', 'Jogodeouro (BR)', 'Juegaenlineachile (CL)',
  'JupiCasino', 'Karamba', 'Karamba (UK)', 'Lapilanders', 'LotoGreen (BR)', 'Lottland (IE)', 'Lottoland',
  'Lottoland (AT)', 'MalinaCasino', 'Mcgames (BR)', 'Merkurxtip (CZ)', 'Metgol (BR)', 'MiСasino',
  'MrBit (BG)', 'MrBit (RO)', 'MultiBet (BR)', 'NinjaCasino', 'Novajackpot', 'Playdoit (MX)', 'PowBet',
  'Rabona', 'RabonaBet', 'RtBet', 'SlotV (RO)', 'SONSofSLOTS', 'Spinanga', 'Sportaza', 'StarCasinoSport (BE)',
  'Supacasi', 'SvenBet', 'Svenplay', 'ToonieBet (CA)', 'Vavada', 'Vegas (HU)', 'Wazamba', 'Winpot (MX)',
  'Betrivers (CA)', 'Betrivers (AZ)', 'Betsafe', 'Bethard', 'Betsafe (EE)', 'Betsafe (LV)', 'Betsafe (SE)',
  'Betsson', 'Bets10', 'Betsson (AR)', 'Betsson (BR)', 'Betsson (CO)', 'Betsson (SE)', 'Inkabet (PE)',
  'Betsson (ES)', 'Betpark (BR)', 'SupremaBet (BR)', 'Betsson (FR)', 'Betsson (GE)', 'Betsson (GR)',
  'Betsmith', 'Betsson (IT)', 'Betsul (BR)', 'Betuk (UK)', 'Betus (PA)', 'BetVictor', 'Parimatch (UK)',
  'Puntit (IN)', 'BetWarrior', 'BetWarrior (BR)', 'BetWarrior (Caba)', 'BetWarrior (MZA)', 'BetWarrior (PBA)',
  'BetWarrior Apuestas (AR)', 'LeoVegas (IT)', 'Svenska Spel (SE)', 'BetWay', 'BetWay (DE)', 'BetWay (ES)',
  'BetWay (MX)', 'BetWay (IT)', 'Betwgb', 'AdmiralBet (ME)', 'AdmiralBet (RS)', 'AdmiralBet (UG)', 'BetX (CZ)',
  'Betxchange', 'Bingoal (BE)', 'BallyBet', 'BetPlay (CO)', 'Bingoal (NL)', 'Desert Diamond', 'Expekt (SE)',
  'Blaze', '4RaBet', '4RaBet (Play)', '500Casino', 'Africa365', 'BC.Game', 'BetFury', 'Betonred',
  'Betonred (NG)', 'BetPlay', 'BetTilt', 'Betvip', 'Betvip (BR)', 'BilBet', 'Bitz', 'Blaze (BR)',
  'BloodMoon (CO)', 'BlueChip', 'Bons', 'CasinoX', 'Casinozer', 'Casinozer (EU)', 'CsGo500', 'Fortunejack',
  'HugeWin', 'JetBet (BR)', 'JonBet (BR)', 'Joycasino', 'Lucky Block', 'Lucky Block (Top)', 'Opabet',
  'PinBet', 'Pokerdom', 'PuskasBet (BR)', 'Rainbet', 'RajaBets', 'Razed', 'Riobet', 'Rivalry', 'Rollbit',
  'RooBet', 'Slots Safari (CO)', 'Solcasino', 'TrBET', 'Yonibet', 'Yonibet (EU)', 'BoaBet', 'Bodog (EU)',
  'Bovada (LV)', 'BolsaDeAposta (BR)', 'BolsaDeAposta TB (BR)', 'BookMaker (EU)', 'JustBet (CO)',
  'BookmakerXyz', 'BoyleSports', 'Brazino 777', 'Brazino 777 (BY)', 'Brazino 777 (IO)', 'Wazobet',
  'BrBet (BR)', 'BresBet', 'Bumbet', 'Bwin', 'Betboo (BR)', 'Betmgm (CA)', 'Betmgm (MA)', 'Betmgm (NY)',
  'Bwin (BE)', 'Bwin (DE)', 'Bwin (DK)', 'Bwin (ES)', 'Bwin (GR)', 'Bwin (IT)', 'Gamebookers',
  'Giocodigitale (IT)', 'Ladbrokes (DE)', 'Oddset (DE)', 'Partypoker', 'Sportingbet', 'Sportingbet (BR)',
  'Sportingbet (DE)', 'Sportingbet (GR)', 'Sportingbet (ZA)', 'Vistabet (GR)', 'Bwin (FR)', 'Bwin (PT)',
  'Caliente (MX)', 'Betcha (PA)', 'Marca Apuestas (ES)', 'Wplay (CO)', 'CampoBet (DK)', 'Casa Pariurilor (RO)',
  'Fortuna (RO)', 'CasaDeApostas (BR)', 'Betmais', 'CasinoPortugal (PT)', 'CBet', 'CBet (LT)', 'Circus (BE)',
  'Circus (NL)', 'CloudBet', 'Codere (ES)', 'Codere (AR)', 'Codere (MX)', 'Comeon', 'Casinostugan',
  'Comeon (PL)', 'Hajper', 'Lyllo Casino', 'MobileBet', 'Nopeampi', 'Pzbuk (PL)', 'Saga Kingdom',
  'Snabbare', 'SunMaker (DE)', 'Comeon (NL)', 'CoolBet', 'CoolBet (CL)', 'CoolBet (PE)', 'Coral (UK)',
  'Crocobet', 'CrystalBet (GE)', 'DafaBet (ES)', 'DafaBet (Sports)', 'Amperjai', 'Nextbet', 'DafaBet OW (Saba)',
  '12Bet (Saba)', '12Bet (Saba-ID)', '12Bet (Saba-MY)', 'CMD368 (Saba)', 'M88 (Saba)', 'W88Live (Saba)',
  'Danskespil (DK)', 'DaznBet (ES)', 'DaznBet (UK)', 'DomusBet (IT)', 'DoxxBet (SK)', 'Draftkings',
  'Draftking (CT)', 'DragonBet (UK)', 'DripCasino', 'Duelbits', 'Easybet (ZA)', 'Ebingo (ES)', 'BetaBet',
  'BetaBet (Net)', 'Betcoin (AG)', 'ShansBet', 'EDSBet', 'Efbet (ES)', 'Efbet (BG)', 'Efbet (IT)',
  'Efbet (RO)', 'Efbet (GR)', 'Efbet (Net)', 'EGB', 'EGB SPORT', 'EpicBet', 'Eplay24 (IT)',
  'BegameStar (IT)', 'Betwin360 (IT)', 'SportItaliaBet (IT)', 'EsporteNetBet (BR)', 'BetsBola',
  'EsporteNetSP (BR)', 'EsporteNetVip (BR)', 'EsporteNetVip', 'EsportesDaSorte (BR)', 'EstorilSolCasinos (PT)',
  'Etipos (SK)', 'Etopaz (AZ)', 'Etoto (PL)', 'EuroBet (IT)', 'EveryGame (EU)', 'ExclusiveBet', 'Betfinal',
  'IZIbet', 'MrXBet', 'ShangriLa', 'UniClub (LT)', 'Expekt (DK)', 'LeoVegas (DK)', 'F12Bet (BR)',
  'SPIN (BR)', 'Fanatics', 'FanDuel', 'Betfair SB (BR)', 'FanDuel (CT)', 'Fastbet', 'CopyBet (CY)',
  'FavBet', 'FavBet (UA)', 'FB Sports', 'Fonbet', 'BeteryBet (IN)', 'Bettery (RU)', 'Fonbet (GR)',
  'Fonbet (KZ)', 'Fonbet (Mobile)', 'Pari (RU)', 'Football (NG)', 'Fortuna (CZ)', 'Fortuna (PL)',
  'Fortuna (SK)', 'FulltBet (BR)', 'GaleraBet (BR)', '888Casino (Arabic)', 'Gamdom', 'GazzaBet (IT)',
  'Germania (HR)', 'GGBet', 'Freeggbet', 'Vulkan', 'Goalbet', 'GoldBetShop (IT)', 'BetFlag (IT)',
  'GoldBet (IT)', 'IntralotShop (IT)', 'Lottomatica (IT)', 'PlanetWin365 (IT)', 'GoldenPark (ES)',
  'CasinoBarcelona (ES)', 'Solcasino (ES)', 'GoldenPark (PT)', 'GoldenVegas (BE)', 'GrandGame (BY)',
  'HiperBet (BR)', 'HKJC', 'HoliganBet (TR)', 'JojoBet', 'Holland Casino (NL)', 'Hollywoodbets',
  'Hollywoodbets (MZ)', 'iForBet (PL)', 'Ilotbet', 'Interwetten', 'Interwetten (ES)', 'Interwetten (GR)',
  'IviBet', '20Bet', 'Jacks (NL)', 'Expekt', 'JetCasino', 'Flagman', 'FreshCasino', 'Rox (Sport)',
  'Jokerbet (ES)', 'JSB', 'Boltbet (GH)', 'Primabet (GM)', 'TicTacBets (ZA)', 'JugaBet (CL)',
  'Parimatch (TJ)', 'KingsBet (CZ)', 'KirolBet (ES)', 'Apuestasvalor (ES)', 'Aupabet (ES)', 'Juegging (ES)',
  'Kwiff', 'Betkwiff', 'Ladbrokes', 'Ladbrokes (BE)', 'LeaderBet', 'Lebull (PT)', 'Leon', 'Leon (RU)',
  'Twin', 'LeoVegas', 'Betmgm (BR)', 'Williamhill (SE)', 'LeoVegas (ES)', 'LigaStavok (RU)',
  'LivescoreBet (NG)', 'SunBet (ZA)', 'LivescoreBet (UK)', 'LivescoreBet (IE)', 'VirginBet', 'LsBet',
  'KikoBet', 'Mundoapostas', 'ReloadBet', 'SlottoJAM', 'TornadoBet', 'Luckia (ES)', 'Luckia (CO)',
  'Luckia (MX)', 'LvBet', 'LvBet (LV)', 'LvBet (PL)', 'Mansion (M88-BTI)', 'Marathon', 'Marathon (BY)',
  'Marathon (RU)', 'MBet', 'MarathonBet (DK)', 'MarathonBet (ES)', 'MarathonBet (IT)', 'MarjoSports (BR)',
  'Marjo Sports (BR)', 'Marjo', 'Matchbook', 'Maxbet (RS)', 'Maxbet (BA)', 'MaxLine (BY)', 'Mcbookie',
  'StarSports', 'MelBet', 'Betwinner', 'DBbet', 'MelBet (BI)', 'MelBet (KE)', 'MelBet (MN)', 'Meridian',
  'Meridian (CY)', 'Meridian (BE)', 'Meridian (BA)', 'Meridian (ME)', 'Meridian (RS)', 'Meridian (PE)',
  'JogaBets (MZ)', 'Meridian (BR)', 'MerkurBets', 'Betcenter (BE)', 'Cashpoint (DK)', 'MerkurBets (DE)',
  'Miseojeu+', 'Misli (AZ)', 'MostBet', 'Mozzart', 'Mozzart (BA)', 'Mozzart (NG)', 'Mozzart (RO)',
  'MSport (GH)', 'MSport (NG)', 'Mystake', '31Bet', '9dBet (BR)', 'Betfast', 'Betfast (BR)', 'Donbet',
  'Donbet (Win)', 'Faz1Bet (BR)', 'Freshbet', 'Goldenbet', 'Jackbit', 'Mystake (Bet)', 'Rolletto',
  'TivoBet (BR)', 'Velobet (Win)', 'Wjcasino (BR)', 'N1Bet', '12Play', 'CelsiusCasino', 'Coins Game',
  'Wild', 'YBets', 'NaijaBet', 'NairaBet', 'Napoleon (BE)', 'Neobet', 'Neobet (CA)', 'Neobet (DE)',
  'Neobet (ZA)', 'Nesine (TR)', 'Bilyoner', 'Misli (Com)', 'Oley', 'NetBet', 'Bet777 (BE)', 'Bet777 (ES)',
  'NetBet (GR)', 'NetBet (BR)', 'NetBet (FR)', 'NetBet (IT)', 'DaznBet (IT)', 'OriginalBet (IT)',
  'Plexbet (IT)', 'NetBet (RO)', 'Nike (SK)', 'NitroBetting (EU)', 'Norsk Tipping (NO)', 'Novibet (BR)',
  'Novibet (GR)', 'Novibet (IE)', 'Olimp', 'Olimp (Bet)', 'Olimpbet (KZ)', 'Olimpkz', 'OlimpoBet (PE)',
  'OlyBet (ES)', 'OlyBet (EU)', 'OlyBet (FR)', 'FeelingBet (FR)', 'Genybet (FR)', 'OlyBet (LT)',
  'Onabet (BR)', 'Esporte365 (BR)', 'LuckBet (BR)', 'Luvabet (BR)', 'Optibet (LT)', 'Optibet (LV)',
  'Optibet (EE)', 'OrbitX', 'OrbiteX', 'Paddy Power', 'PameStoixima (GR)', 'Parasino', 'ApxBet',
  'Betonngliga', 'BigBet (BR)', 'LiderBet (BR)', 'RealsBet (BR)', 'Parimatch (KZ)', 'BuddyBet (UA)',
  'Gra (Live)', 'ParionsSport (FR)', 'Paston (ES)', 'Br4bet (BR)', 'SorteOnline (BR)', 'Pin-up',
  'BetPlays', 'Pin-up (RU)', 'BaseBet', 'Casino Spinamba', 'Lucky Bird Casino', 'MarsBet', 'Pin-up (EN)',
  'Slottica', 'Slotty Way', 'Winmasters', 'Winmasters (CY)', 'Winmasters (GR)', 'Winmasters (RO)',
  'Pinnacle', 'P4578 (Asian)', 'P4578 (EU)', 'Pin135 (EU)', 'Pinnacle (Bet)', 'Pinnacle (BR)',
  'Pinnacle (SE)', 'Pinnacle888 (Asian)', 'Pinnacle888 (EU)', 'Piwi247 (SB)', 'PS3838 (Broker)',
  'Start975 (Asian)', 'Start975 (EU)', 'Piwi247', 'PixBet (BR)', 'FlaBet (BR)', 'Pixbet285',
  'Placard (PT)', 'Playbonds', 'PlayNow', 'PMU (FR)', 'PointsBet (AU)', 'PokerStars', 'PokerStars (DK)',
  'PokerStars (RO)', 'PokerStars (FR)', 'PokerStars (UK)', 'PokerStars (CA)', 'PokerStars (ES)',
  'PokerStars (SE)', 'PremierBet (MW)', 'MercuryBet', 'PremierBet (AO)', 'PremierBet (CD)',
  'PremierBet (CG)', 'PremierBet (CM)', 'PremierBet (MZ)', 'PremierBet (SN)', 'PremierBet (TD)',
  'PremierBet (TZ)', 'QQ101 (BTI)', '10Bet (KR)', '12Bet (BTI-ID)', 'Fun88 (IN)', 'QQ101 (IM Sports)',
  'RayBet', 'Reidopitaco (BR)', 'RetaBet (ES)', 'RetaBet (ES-AN)', 'RetaBet (PE)', 'RicoBet (BR)',
  'BetGorillas (BR)', 'KingpandaBet (BR)', 'Rivalo (BR)', 'Rivalo (CO)', 'RuBet', 'Rushbet (CO)',
  'GoldenBull (SE)', 'Rushbet (MX)', 'Sazka (CZ)', 'Sbobet', 'Pic5678', 'SbobetAsia', 'SboTop',
  'Sbobet (Esport)', '12Bet (Esport)', 'BTC365 (Esport)', 'VKGame', 'SeuBet (BR)', '747 Live',
  'Shuffle', 'Sisal (IT)', 'PokerStars (IT)', 'SkyBet', 'Smarkets', 'Snai (IT)', 'SoccaBet',
  'SolisBet', 'Solverde (PT)', 'SorteNaBet (BR)', 'Bateu (BR)', 'Betfusion (BR)', 'BullsBet (BR)',
  'SportBet (IT)', 'BetX (IT)', 'StarGame (IT)', 'SportingWin', 'Sportium (CO)', 'Sportium (ES)',
  'Sportmarket', 'SportsBet', 'SportsBet (AU)', 'SportyBet', 'SportyBet (BR)', 'Stake', 'Stake (BR)',
  'KTO (BR)', 'Stake (CO)', 'Frumzi', 'FunBet', 'LibraBet', 'MafiaCasino', 'StoneVegas', 'StanleyBet (BE)',
  'StanleyBet (IT)', 'StanleyBet (RO)', 'Admiral (RO)', 'StarCasino (NL)', 'Stoiximan (GR)',
  'Stoiximan (CY)', 'STS (PL)', 'SuperBet (BR)', 'Super Bet (BR)', 'SuperBet (PL)',
  'SuperBet (RO)', 'SuperBet (RS)', 'Surebet247', 'SX Bet', 'SynotTip (LV)', 'SynotTip (CZ)', 'SynotTip (SK)',
  'Tab (AU)', 'TeApuesto (PE)', 'TempoBet', 'Tennisi', 'Tennisi (Bet)', 'Tennisi (KZ)',
  'ThunderPickIo (NO)', 'Tipico', 'Tipico (DE)', 'Tipp3 (AT)', 'TippmixPro (HU)', 'Tipsport (CZ)',
  'Chance (CZ)', 'Tipsport (SK)', 'Tipwin (DE)', 'Tipwin', 'Tipwin (DK)', 'Tipwin (SE)', 'TonyBet',
  'Vave', 'TonyBet (ES)', 'TonyBet (NL)', 'Topsport (LT)', 'Toto (NL)', 'TotoGaming (AM)',
  '1Win (Provider)', 'Cannonbet', 'CaptainsBet (KE)', 'MelBet (NG)', 'MelBet (RU)', 'Sol.Casino',
  'Tinbet (PE)', 'Winspirit', 'Ubet (CY)', 'Ubet (KZ)', 'Betera (BY)', 'Unibet (DK)', 'Unibet (BE)',
  'Unibet (FI)', 'Unibet (SE)', 'Unibet (FR)', 'Unibet (RO)', 'ATG (SE)', 'Betmgm (NL)', 'Betmgm (SE)',
  'Betmgm (UK)', 'Casumo', 'Casumo (ES)', 'GrosvenorCasinos', 'No Account Bet (SE)', 'Paf', 'Paf (ES)',
  'Paf (SE)', 'PafBet (LV)', 'Scoore (BE)', 'Unibet (AU)', 'Unibet (IT)', 'Unibet (MT)', 'Unibet (NL)',
  'VBet', 'Bets60', 'H2bet (BR)', 'Hash636', 'Uabet', 'VBet (AM)', 'VBet (BR)', '7Games (BR)',
  'Seguro (BR)', 'VBet (FR)', 'VBet (LAT)', 'VBet (NL)', 'VBet (UK)', 'Veikkaus (FI)', 'Versus (ES)',
  'Vivasorte (BR)', '4Play (BR)', '4Win (BR)', 'Ginga (BR)', 'QG (BR)', 'Zeroum (BR)', 'Vulkan Bet',
  'W88Es', 'Wildz', 'William Hill', 'Williamhill (ES)', 'Williamhill (IT)', 'Winamax (ES)',
  'Winamax (DE)', 'Winamax (FR)', 'WinBet (BG)', 'WinBet (RO)', 'Winline (RU)', 'WolfBet',
  'WonderBet (CO)', 'WWin', 'YaassCasino (ES)', 'Yabo888', 'Yajuego (CO)', 'YSB', 'Zamba (CO)',
  'ZeBet', 'ZeBet (BE)', 'ZeBet (ES)', 'ZeBet (NL)', 'Zenit', 'Zenit (Win)'
];

interface BetData {
  house: string | null;
  odd: number | null;
  type: string | null;
  stake: number | null;
  profit: number | null;
}

interface ExtractedData {
  date: string | null;
  sport: string | null;
  league: string | null;
  teamA: string | null;
  teamB: string | null;
  bet1: BetData;
  bet2: BetData;
  bet3: BetData;
  profitPercentage: number | null;
}

function preprocessarLinhasQuebradas(texto: string): string {
  const lines = texto.split('\n');
  const linesProcessadas: string[] = [];
  
  let i = 0;
  while (i < lines.length) {
    const linhaAtual = lines[i].trim();
    
    if (!linhaAtual) {
      i++;
      continue;
    }
    
    if (i + 1 < lines.length && 
        ['(BR)', '(CO)', '(PT)', '(RO)', '(BE)', '(MX)', '(UK)', '(ZA)', '(SE)'].includes(lines[i + 1].trim())) {
      const linhaJuntada = linhaAtual + ' ' + lines[i + 1].trim();
      linesProcessadas.push(linhaJuntada);
      i += 2;
      continue;
    }
    
    const temOddsUsd = linhaAtual.includes('USD') && /\d/.test(linhaAtual);
    
    if (temOddsUsd && i + 1 < lines.length) {
      const proximaLinha = lines[i + 1].trim();
      const temOddsSignificativos = /\d+\.\d+|\d+\s+USD/.test(proximaLinha);
      
      const ehContinuacao = proximaLinha && 
                            !temOddsSignificativos &&
                            !['〉', '○', '●'].includes(proximaLinha) &&
                            !['aposta total', 'mostrar', 'use sua', 'arredondar', 'evento', 'chance']
                              .some(kw => proximaLinha.toLowerCase().includes(kw)) &&
                            proximaLinha.length > 2;
      
      if (ehContinuacao) {
        const linhaJuntada = linhaAtual + ' ' + proximaLinha;
        linesProcessadas.push(linhaJuntada);
        i += 2;
        continue;
      }
    }
    
    linesProcessadas.push(linhaAtual);
    i++;
  }
  
  return linesProcessadas.join('\n');
}

function detectarCasaApostas(linha: string): string | null {
  const linhaLower = linha.toLowerCase();
  
  const casasOrdenadas = [...CASAS_SISTEMA].sort((a, b) => {
    const lenDiff = b.length - a.length;
    if (lenDiff !== 0) return lenDiff;
    return a.includes('(') ? 1 : -1;
  });
  
  for (const casa of casasOrdenadas) {
    const casaLowerNormalized = casa.toLowerCase();
    
    if (casaLowerNormalized.includes('(')) {
      if (casaLowerNormalized.includes(' (')) {
        const [nomeBase, sufixo] = casaLowerNormalized.split(' (', 2);
        const sufixoCompleto = '(' + sufixo;
        
        const palavrasBase = nomeBase.split(/\s+/);
        const todasPalavrasPresentes = palavrasBase.every(palavra => linhaLower.includes(palavra));
        const sufixoPresente = linhaLower.includes(sufixoCompleto);
        
        if (todasPalavrasPresentes && sufixoPresente) {
          const posPrimeira = linhaLower.indexOf(palavrasBase[0]);
          const posSufixo = linhaLower.indexOf(sufixoCompleto);
          if (posPrimeira < posSufixo) {
            return casa;
          }
        }
      } else {
        if (linhaLower.includes(casaLowerNormalized)) {
          return casa;
        }
      }
    } else {
      const casaPattern = casaLowerNormalized.replace(/\s+/g, '\\s*');
      const regex = new RegExp('\\b' + casaPattern + '\\b', 'i');
      if (regex.test(linhaLower)) {
        return casa;
      }
    }
  }
  
  const match = linha.match(/^([A-Z][A-Za-z\s()]{2,30})\s+[A-Za-z0-9()+\-≥≤.]+\s+\d+\.\d+/);
  if (match) {
    const casaCandidta = match[1].trim();
    if (casaCandidta.length >= 3) {
      return casaCandidta;
    }
  }
  
  const palavras = linha.trim().split(/\s+/);
  if (palavras.length > 0) {
    const primeiraPalavra = palavras[0];
    if (primeiraPalavra.length >= 3 && primeiraPalavra.length <= 15 && /^[A-Z]/.test(primeiraPalavra)) {
      for (const casa of CASAS_SISTEMA) {
        const casaLimpa = casa.split('(')[0].trim();
        if (casaLimpa.toLowerCase().startsWith(primeiraPalavra.toLowerCase())) {
          return primeiraPalavra;
        }
      }
    }
  }
  
  return null;
}

function processarApostaCompleta(textoAposta: string, casaAposta: string): BetData {
  const simboloMatch = textoAposta.match(/[●○\uf35d]/);
  
  let parteAntesSimolo: string;
  let parteDepoisSimbolo: string;
  
  if (simboloMatch && simboloMatch.index !== undefined) {
    parteAntesSimolo = textoAposta.substring(0, simboloMatch.index).trim();
    parteDepoisSimbolo = textoAposta.substring(simboloMatch.index + 1).trim();
  } else {
    const moedaMatch = textoAposta.match(/(USD|BRL)/);
    if (moedaMatch && moedaMatch.index !== undefined) {
      parteAntesSimolo = textoAposta.substring(0, moedaMatch.index).trim();
      parteDepoisSimbolo = textoAposta.substring(moedaMatch.index).trim();
    } else {
      parteAntesSimolo = textoAposta;
      parteDepoisSimbolo = '';
    }
  }
  
  const numerosAntes = parteAntesSimolo.match(/\d+\.\d+/g) || [];
  let odd: number | null = null;
  
  if (numerosAntes.length > 0) {
    for (let i = numerosAntes.length - 1; i >= 0; i--) {
      const num = parseFloat(numerosAntes[i]);
      if (num >= 1.0 && num <= 50.0) {
        odd = num;
        break;
      }
    }
    
    if (!odd) {
      odd = parseFloat(numerosAntes[numerosAntes.length - 1]);
    }
  }
  
  let stake: number | null = null;
  let profit: number | null = null;
  
  const stakeMatches = textoAposta.match(/(\d+\.?\d*)\s+(USD|BRL)/g);
  if (stakeMatches && stakeMatches.length > 0) {
    const firstMatch = stakeMatches[0].match(/(\d+\.?\d*)/);
    if (firstMatch) {
      stake = parseFloat(firstMatch[1]);
    }
  }
  
  const todosNumeros = textoAposta.match(/\d+\.\d+/g) || [];
  
  if (stake) {
    const stakeStr = stake.toString().replace('.', '\\.');
    const stakePattern = new RegExp(stakeStr);
    const stakeMatch = textoAposta.match(stakePattern);
    if (stakeMatch && stakeMatch.index !== undefined) {
      const textoPosStake = textoAposta.substring(stakeMatch.index + stakeMatch[0].length);
      const numerosPosStake = textoPosStake.match(/\d+\.\d+/g);
      if (numerosPosStake && numerosPosStake.length > 0) {
        profit = parseFloat(numerosPosStake[numerosPosStake.length - 1]);
      }
    }
  }
  
  if (!profit) {
    for (let i = todosNumeros.length - 1; i >= 0; i--) {
      const num = parseFloat(todosNumeros[i]);
      if (num !== stake && num !== odd && num < 1000) {
        profit = num;
        break;
      }
    }
  }
  
  let tipoCompleto = textoAposta.replace(casaAposta, '').trim();
  tipoCompleto = tipoCompleto.replace(/\(BR\)/g, '').trim();
  
  const palavras = tipoCompleto.split(/\s+/);
  const palavrasFiltradas: string[] = [];
  
  const palavrasChaveTipo = ['acima', 'abaixo', 'total', 'over', 'under', 'mais', 'menos',
                             'primeiro', 'segundo', 'tempo', 'extra', '1º', '2º'];
  
  for (let i = 0; i < palavras.length; i++) {
    const palavra = palavras[i];
    
    if (palavra === 'USD' || palavra === 'BRL') {
      continue;
    }
    
    let palavraAnteriorEhChave = false;
    if (i > 0) {
      const palavraAnteriorLower = palavras[i - 1].toLowerCase().replace(/[≥≤]/g, '').trim();
      palavraAnteriorEhChave = palavrasChaveTipo.some(chave => palavraAnteriorLower.includes(chave));
    }
    
    if (/^-?\d+\.?\d*$/.test(palavra)) {
      const num = parseFloat(palavra);
      
      if (palavraAnteriorEhChave) {
        palavrasFiltradas.push(palavra);
        continue;
      }
      
      if (odd && Math.abs(num - odd) < 0.01) continue;
      if (stake && Math.abs(num - stake) < 0.01) continue;
      if (profit && Math.abs(num - profit) < 0.01) continue;
      if (num < 0) continue;
    }
    
    palavrasFiltradas.push(palavra);
  }
  
  let tipoAposta = palavrasFiltradas.join(' ');
  
  tipoAposta = tipoAposta.replace(/[●○]/g, '');
  tipoAposta = tipoAposta.replace(/\uf35d/g, '');
  tipoAposta = tipoAposta.replace(/\u232A/g, '');
  tipoAposta = tipoAposta.replace(/\s+/g, ' ').trim();
  tipoAposta = tipoAposta.replace(/[-–]\s*$/, '').trim();
  
  const casaSemParenteses = casaAposta.replace(/\s*\([A-Z]{2}\)\s*/g, '').trim();
  tipoAposta = tipoAposta.replace(new RegExp('\\b' + casaSemParenteses + '\\b', 'gi'), '');
  
  const casasConhecidas: Record<string, string[]> = {
    'estrela': ['EstrelaBet', 'Estrela'],
    'pinnacle': ['Pinnacle'],
    'marjo': ['MarjoSports', 'Marjo', 'Sports'],
    'super': ['SuperBet', 'Super'],
    'stake': ['Stake'],
    'kto': ['KTO'],
    'blaze': ['Blaze'],
    'multibet': ['MultiBet', 'Multi'],
    'bravo': ['BravoBet', 'Bravo'],
    'betfast': ['Betfast'],
    'betano': ['Betano']
  };
  
  const casaLower = casaSemParenteses.toLowerCase();
  
  for (const [chave, palavrasRemover] of Object.entries(casasConhecidas)) {
    if (casaLower.includes(chave)) {
      for (const palavraRemover of palavrasRemover) {
        tipoAposta = tipoAposta.replace(new RegExp('\\b' + palavraRemover + '\\b', 'gi'), '');
      }
      break;
    }
  }
  
  tipoAposta = tipoAposta.replace(/\s+/g, ' ').trim();
  
  return {
    house: casaAposta,
    odd: odd,
    type: tipoAposta || null,
    stake: stake,
    profit: profit
  };
}

export async function extractDataFromPdf(pdfBuffer: Buffer): Promise<ExtractedData> {
  const dados: ExtractedData = {
    date: null,
    sport: null,
    league: null,
    teamA: null,
    teamB: null,
    bet1: { house: null, odd: null, type: null, stake: null, profit: null },
    bet2: { house: null, odd: null, type: null, stake: null, profit: null },
    bet3: { house: null, odd: null, type: null, stake: null, profit: null },
    profitPercentage: null
  };
  
  try {
    const pdfData = await pdfParse(pdfBuffer);
    const texto = pdfData.text;
    
    if (!texto) {
      return dados;
    }
    
    const textoPreprocessado = preprocessarLinhasQuebradas(texto);
    const linhas = textoPreprocessado.split('\n').map(l => l.trim()).filter(l => l);
    
    for (const linha of linhas) {
      if (linha.includes('Evento') && linha.includes('(')) {
        const matchData = linha.match(/\((\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/);
        if (matchData) {
          try {
            const dataStr = matchData[1].trim();
            const [datePart, timePart] = dataStr.split(/\s+/);
            dados.date = `${datePart}T${timePart}`;
          } catch (e) {
          }
        }
        break;
      }
    }
    
    for (const linha of linhas) {
      if (linha.includes('–') && linha.includes('%') && !linha.includes('ROI') && !linha.includes('Evento')) {
        const matchPercent = linha.match(/(\d+\.\d+)%\s*$/);
        if (matchPercent) {
          dados.profitPercentage = parseFloat(matchPercent[1]);
          const linhaTimes = linha.substring(0, matchPercent.index).trim();
          
          if (linhaTimes.includes('–')) {
            const times = linhaTimes.split('–');
            if (times.length >= 2) {
              dados.teamA = times[0].trim();
              dados.teamB = times[1].trim();
            }
          }
        } else if (linha.includes('–')) {
          const times = linha.split('–');
          if (times.length >= 2) {
            dados.teamA = times[0].trim();
            dados.teamB = times[1].trim();
          }
        }
        break;
      }
    }
    
    let indiceTimes = -1;
    for (let i = 0; i < linhas.length; i++) {
      if (dados.teamA && dados.teamB && linhas[i].includes(dados.teamA) && linhas[i].includes(dados.teamB)) {
        indiceTimes = i;
        break;
      }
    }
    
    const esportes = ['futebol', 'football', 'soccer', 'basquete', 'basketball', 'basquetebol',
                      'tênis', 'tennis', 'hóquei', 'hockey', 'hoquei', 'beisebol', 'beisebal',
                      'baseball', 'voleibol', 'volleyball', 'vôlei', 'volei', 'handball',
                      'handebol', 'rugby', 'cricket', 'futsal'];
    
    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i];
      
      if (indiceTimes >= 0 && Math.abs(i - indiceTimes) > 5) {
        continue;
      }
      
      if (linha.includes(' / ') && esportes.some(sport => linha.toLowerCase().includes(sport))) {
        const partes = linha.split(' / ');
        if (partes.length >= 2) {
          dados.sport = partes[0].trim();
          dados.league = partes.slice(1).join(' / ').trim();
        }
        break;
      }
    }
    
    if (!dados.sport && dados.teamA && indiceTimes >= 0) {
      for (let i = indiceTimes + 1; i < Math.min(indiceTimes + 4, linhas.length); i++) {
        const linha = linhas[i];
        
        if (linha.includes(' / ') &&
            !linha.includes('Evento') &&
            !linha.includes('ROI') &&
            !linha.includes('–') &&
            !linha.includes('%') &&
            !linha.includes('USD') &&
            !linha.includes('BRL') &&
            !linha.includes('Chance') &&
            !linha.includes('Aposta') &&
            !/\d+\.\d{2,}/.test(linha)) {
          
          const partes = linha.split(' / ');
          if (partes.length >= 2) {
            const possivelEsporte = partes[0].trim();
            const possivelLiga = partes.slice(1).join(' / ').trim();
            
            if (possivelEsporte.length < 30 && possivelEsporte && !/\d{2,}/.test(possivelEsporte)) {
              dados.sport = possivelEsporte;
              dados.league = possivelLiga;
              break;
            }
          }
        }
      }
    }
    
    const apostasEncontradas: BetData[] = [];
    
    let i = 0;
    while (i < linhas.length) {
      const linha = linhas[i];
      let casaEncontrada = detectarCasaApostas(linha);
      
      if (casaEncontrada) {
        let textoAposta = linha;
        let j = i + 1;
        
        const fragmentosCasa: string[] = [];
        const linhasUsadasFragmentos = new Set<number>();
        const linhasParcialmenteUsadas: Record<number, string> = {};
        
        while (j < linhas.length && j < i + 4) {
          const proximaLinha = linhas[j].trim();
          
          if (!proximaLinha || ['〉', '○', '●', '\uf35d', 'new'].includes(proximaLinha)) {
            j++;
            continue;
          }
          
          if (['USD', 'BRL', '●', '○', '\uf35d'].some(s => proximaLinha.includes(s)) || /\d+\.\d+/.test(proximaLinha)) {
            break;
          }
          
          if (proximaLinha.length < 30) {
            const novaCasa = detectarCasaApostas(proximaLinha);
            
            if (!novaCasa) {
              if (/^\([A-Z]{2}\)$/.test(proximaLinha)) {
                fragmentosCasa.push(proximaLinha);
                linhasUsadasFragmentos.add(j);
                j++;
              } else if (proximaLinha.split(/\s+/).length === 1 && /^[A-Z]/.test(proximaLinha)) {
                fragmentosCasa.push(proximaLinha);
                linhasUsadasFragmentos.add(j);
                j++;
              } else if (/^[A-Z]/.test(proximaLinha)) {
                const palavrasProx = proximaLinha.split(/\s+/);
                if (/^[A-Z]/.test(palavrasProx[0]) && !/\b(gol|time|cantos?|escanteios?|acima|abaixo)\b/i.test(palavrasProx[0])) {
                  fragmentosCasa.push(palavrasProx[0]);
                  const resto = palavrasProx.slice(1).join(' ');
                  if (resto) {
                    linhasParcialmenteUsadas[j] = resto;
                  }
                  linhasUsadasFragmentos.add(j);
                  j++;
                } else {
                  break;
                }
              } else {
                break;
              }
            } else {
              break;
            }
          } else {
            break;
          }
        }
        
        if (fragmentosCasa.length > 0) {
          casaEncontrada = casaEncontrada + ' ' + fragmentosCasa.join(' ');
        }
        
        if (casaEncontrada.startsWith('Marjo') && !casaEncontrada.includes('Sports')) {
          for (let k = i; k < Math.min(j, linhas.length); k++) {
            if (linhas[k].includes('Sports')) {
              casaEncontrada = 'Marjo Sports (BR)';
              break;
            }
          }
        }
        
        while (j < linhas.length && j < i + 8) {
          const proximaLinha = linhas[j];
          
          if (linhasUsadasFragmentos.has(j)) {
            if (j in linhasParcialmenteUsadas) {
              textoAposta += ' ' + linhasParcialmenteUsadas[j];
            }
            j++;
            continue;
          }
          
          const palavrasLinha = proximaLinha.trim().split(/\s+/);
          if (palavrasLinha.length > 0) {
            const primeiraPalavra = palavrasLinha[0];
            
            if (primeiraPalavra.length >= 3 &&
                primeiraPalavra.length <= 15 &&
                /^[A-Z]/.test(primeiraPalavra) &&
                !/\d+\.\d+/.test(proximaLinha)) {
              
              const possivelCasa = detectarCasaApostas(primeiraPalavra);
              if (possivelCasa) {
                const casaAtualBase = casaEncontrada ? casaEncontrada.split(/\s+/)[0] : '';
                if (casaAtualBase.toLowerCase() !== primeiraPalavra.toLowerCase()) {
                  break;
                }
              }
            }
          }
          
          const casaNaProxima = detectarCasaApostas(proximaLinha);
          if (casaNaProxima) {
            const casaAtualBase = casaEncontrada ? casaEncontrada.split(/\s+/)[0] : '';
            const casaProximaBase = casaNaProxima ? casaNaProxima.split(/\s+/)[0] : '';
            
            if (casaAtualBase.toLowerCase() !== casaProximaBase.toLowerCase()) {
              break;
            }
          }
          
          if (['Aposta total', 'Mostrar', 'Use sua', 'Arredondar'].some(kw => proximaLinha.includes(kw))) {
            break;
          }
          
          const temDadosFinanceiros = ['USD', 'BRL', '●', '○'].some(kw => proximaLinha.includes(kw)) || /\d+\.\d+/.test(proximaLinha);
          const ehContinuacaoTipo = /\b(gol|time|cantos?|escanteios?|resultado|final|tempo|minuto|chute|corner|primeiro|segundo|1º|2º|over|under|acima|abaixo|casa|fora|empate|handicap)\b/i.test(proximaLinha);
          const ehLinhaCurta = proximaLinha.split(/\s+/).length <= 6;
          
          if (temDadosFinanceiros || (ehContinuacaoTipo && ehLinhaCurta)) {
            textoAposta += ' ' + proximaLinha;
            j++;
          } else {
            break;
          }
        }
        
        const aposta = processarApostaCompleta(textoAposta, casaEncontrada);
        if (aposta && aposta.house && aposta.odd) {
          apostasEncontradas.push(aposta);
        }
        
        i = j;
      } else {
        i++;
      }
    }
    
    if (apostasEncontradas.length >= 1) {
      dados.bet1 = apostasEncontradas[0];
    }
    
    if (apostasEncontradas.length >= 2) {
      dados.bet2 = apostasEncontradas[1];
    }
    
    if (apostasEncontradas.length >= 3) {
      dados.bet3 = apostasEncontradas[2];
    }
    
  } catch (error) {
    console.error('[PDF Parser] Error processing PDF:', error);
  }
  
  return dados;
}
