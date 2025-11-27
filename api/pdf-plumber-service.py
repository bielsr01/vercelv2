from http.server import BaseHTTPRequestHandler
import json
import base64
from io import BytesIO
import traceback
import re
from datetime import datetime
import sys

try:
    import pdfplumber
except ImportError:
    pdfplumber = None

def preprocessar_linhas_quebradas(texto):
    lines = texto.split('\n')
    lines_processadas = []
    
    i = 0
    while i < len(lines):
        linha_atual = lines[i].strip()
        
        if not linha_atual:
            i += 1
            continue
            
        if (i + 1 < len(lines) and 
            lines[i + 1].strip() in ['(BR)', '(CO)', '(PT)', '(RO)', '(BE)', '(MX)', '(UK)', '(ZA)', '(SE)']):
            linha_juntada = linha_atual + ' ' + lines[i + 1].strip()
            lines_processadas.append(linha_juntada)
            i += 2
            continue
        
        tem_odds_usd = 'USD' in linha_atual and any(char.isdigit() for char in linha_atual)
        
        if tem_odds_usd and i + 1 < len(lines):
            proxima_linha = lines[i + 1].strip()
            
            tem_odds_significativos = bool(re.search(r'\d+\.\d+|\d+\s+USD', proxima_linha))
            
            eh_continuacao = (proxima_linha and 
                            not tem_odds_significativos and
                            proxima_linha not in ['〉', '○', '●'] and
                            not any(keyword in proxima_linha.lower() for keyword in 
                                   ['aposta total', 'mostrar', 'use sua', 'arredondar', 'evento', 'chance']) and
                            len(proxima_linha) > 2)
            
            if eh_continuacao:
                linha_juntada = linha_atual + ' ' + proxima_linha
                lines_processadas.append(linha_juntada)
                i += 2
                continue
        
        lines_processadas.append(linha_atual)
        i += 1
    
    return '\n'.join(lines_processadas)

CASAS_SISTEMA = [
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
    'Stoiximan (CY)', 'Stoiximan (GR)', 'STS (PL)', 'SuperBet (BR)', 'Super Bet (BR)', 'SuperBet (PL)', 
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
]

def detectar_casa_apostas(linha):
    linha_lower = linha.lower()
    
    casas_ordenadas = sorted(CASAS_SISTEMA, key=lambda x: (-len(x), '(' not in x))
    
    for casa in casas_ordenadas:
        casa_lower_normalized = casa.lower()
        
        if '(' in casa_lower_normalized:
            if ' (' in casa_lower_normalized:
                nome_base, sufixo = casa_lower_normalized.split(' (', 1)
                sufixo = '(' + sufixo
                
                palavras_base = nome_base.split()
                todas_palavras_presentes = all(palavra in linha_lower for palavra in palavras_base)
                sufixo_presente = sufixo in linha_lower
                
                if todas_palavras_presentes and sufixo_presente:
                    pos_primeira = linha_lower.find(palavras_base[0])
                    pos_sufixo = linha_lower.find(sufixo)
                    if pos_primeira < pos_sufixo:
                        return casa
            else:
                if casa_lower_normalized in linha_lower:
                    return casa
        else:
            casa_pattern = re.escape(casa_lower_normalized).replace(r'\ ', r'\s*')
            if re.search(r'\b' + casa_pattern + r'\b', linha_lower):
                return casa
    
    match = re.search(r'^([A-Z][A-Za-z\s\(\)]{2,30})\s+[A-Za-z0-9()+\-≥≤\.]+\s+\d+\.\d+', linha)
    if match:
        casa_candidata = match.group(1).strip()
        if len(casa_candidata) >= 3:
            return casa_candidata
    
    palavras = linha.strip().split()
    if palavras:
        primeira_palavra = palavras[0]
        if len(primeira_palavra) >= 3 and len(primeira_palavra) <= 15 and primeira_palavra[0].isupper():
            for casa in CASAS_SISTEMA:
                casa_limpa = casa.split('(')[0].strip()
                if casa_limpa.lower().startswith(primeira_palavra.lower()):
                    return primeira_palavra
    
    return None

def processar_aposta_completa(texto_aposta, casa_aposta):
    simbolo_match = re.search(r'[●○\uf35d]', texto_aposta)
    
    if simbolo_match:
        parte_antes_simbolo = texto_aposta[:simbolo_match.start()].strip()
        parte_depois_simbolo = texto_aposta[simbolo_match.end():].strip()
    else:
        moeda_match = re.search(r'(USD|BRL)', texto_aposta)
        if moeda_match:
            parte_antes_simbolo = texto_aposta[:moeda_match.start()].strip()
            parte_depois_simbolo = texto_aposta[moeda_match.start():].strip()
        else:
            parte_antes_simbolo = texto_aposta
            parte_depois_simbolo = ""
    
    numeros_antes = re.findall(r'\d+\.\d+', parte_antes_simbolo)
    odd = None
    
    if numeros_antes:
        for num_str in reversed(numeros_antes):
            num = float(num_str)
            if 1.0 <= num <= 50.0:
                odd = num
                break
        
        if not odd:
            odd = float(numeros_antes[-1])
    
    stake = None
    profit = None
    
    stake_matches = re.findall(r'(\d+\.?\d*)\s+(USD|BRL)', texto_aposta)
    if stake_matches:
        stake = float(stake_matches[0][0])
    
    todos_numeros = re.findall(r'\d+\.\d+', texto_aposta)
    
    if stake:
        stake_str = str(stake).replace('.', r'\.')
        stake_pattern = re.search(stake_str, texto_aposta)
        if stake_pattern:
            texto_pos_stake = texto_aposta[stake_pattern.end():]
            numeros_pos_stake = re.findall(r'\d+\.\d+', texto_pos_stake)
            if numeros_pos_stake:
                profit = float(numeros_pos_stake[-1])
    
    if not profit:
        for num_str in reversed(todos_numeros):
            num = float(num_str)
            if num != stake and num != odd and num < 1000:
                profit = num
                break
    
    tipo_completo = texto_aposta.replace(casa_aposta, '', 1).strip()
    tipo_completo = re.sub(r'\(BR\)', '', tipo_completo).strip()
    
    palavras = tipo_completo.split()
    palavras_filtradas = []
    
    palavras_chave_tipo = ['acima', 'abaixo', 'total', 'over', 'under', 'mais', 'menos', 
                           'primeiro', 'segundo', 'tempo', 'extra', '1º', '2º']
    
    for i, palavra in enumerate(palavras):
        if palavra in ['USD', 'BRL']:
            continue
        
        palavra_anterior_eh_chave = False
        if i > 0:
            palavra_anterior_lower = palavras[i-1].lower().replace('≥', '').replace('≤', '').strip()
            palavra_anterior_eh_chave = any(chave in palavra_anterior_lower for chave in palavras_chave_tipo)
        
        if re.match(r'^-?\d+\.?\d*$', palavra):
            num = float(palavra)
            
            if palavra_anterior_eh_chave:
                palavras_filtradas.append(palavra)
                continue
            
            if (odd and abs(num - odd) < 0.01):
                continue
            if (stake and abs(num - stake) < 0.01):
                continue
            if (profit and abs(num - profit) < 0.01):
                continue
            
            if num < 0:
                continue
        
        palavras_filtradas.append(palavra)
    
    tipo_aposta = ' '.join(palavras_filtradas)
    
    tipo_aposta = re.sub(r'[●○]', '', tipo_aposta)
    tipo_aposta = re.sub(r'\uf35d', '', tipo_aposta)
    tipo_aposta = tipo_aposta.replace('\u232A', '')
    tipo_aposta = re.sub(r'\s+', ' ', tipo_aposta).strip()
    tipo_aposta = re.sub(r'[-–]\s*$', '', tipo_aposta).strip()
    
    casa_sem_parenteses = re.sub(r'\s*\([A-Z]{2}\)\s*', '', casa_aposta).strip()
    
    tipo_aposta = re.sub(r'\b' + re.escape(casa_sem_parenteses) + r'\b', '', tipo_aposta, flags=re.IGNORECASE)
    
    casas_conhecidas = {
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
    }
    
    casa_lower = casa_sem_parenteses.lower()
    
    for chave, palavras_remover in casas_conhecidas.items():
        if chave in casa_lower:
            for palavra in palavras_remover:
                tipo_aposta = re.sub(r'\b' + re.escape(palavra) + r'\b', '', tipo_aposta, flags=re.IGNORECASE)
            break
    
    tipo_aposta = re.sub(r'\s+', ' ', tipo_aposta).strip()
    
    return {
        'house': casa_aposta,
        'odd': odd,
        'type': tipo_aposta if tipo_aposta else None,
        'stake': stake,
        'profit': profit
    }

def extrair_dados_pdf_bytes(pdf_bytes):
    dados = {
        'date': None,
        'sport': None,
        'league': None,
        'teamA': None,
        'teamB': None,
        'bet1': {'house': None, 'odd': None, 'type': None, 'stake': None, 'profit': None},
        'bet2': {'house': None, 'odd': None, 'type': None, 'stake': None, 'profit': None},
        'bet3': {'house': None, 'odd': None, 'type': None, 'stake': None, 'profit': None},
        'profitPercentage': None
    }
    
    if not pdfplumber:
        return dados
    
    try:
        with pdfplumber.open(BytesIO(pdf_bytes)) as pdf:
            for pagina in pdf.pages[:2]:
                texto = pagina.extract_text()
                if not texto:
                    continue
                
                texto_preprocessado = preprocessar_linhas_quebradas(texto)
                linhas = [linha.strip() for linha in texto_preprocessado.split('\n') if linha.strip()]
                
                for linha in linhas:
                    if 'Evento' in linha and '(' in linha:
                        match_data = re.search(r'\((\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})', linha)
                        if match_data:
                            try:
                                data_str = match_data.group(1).strip()
                                dt = datetime.strptime(data_str, '%Y-%m-%d %H:%M')
                                dados['date'] = dt.strftime('%Y-%m-%dT%H:%M')
                            except:
                                pass
                        break
                
                for linha in linhas:
                    if '–' in linha and '%' in linha and 'ROI' not in linha and 'Evento' not in linha:
                        match_percent = re.search(r'(\d+\.\d+)%\s*$', linha)
                        if match_percent:
                            dados['profitPercentage'] = float(match_percent.group(1))
                            linha_times = linha[:match_percent.start()].strip()
                        else:
                            linha_times = linha
                        
                        if '–' in linha_times:
                            times = linha_times.split('–')
                            if len(times) >= 2:
                                dados['teamA'] = times[0].strip()
                                dados['teamB'] = times[1].strip()
                        break
                
                indice_times = -1
                for i, linha in enumerate(linhas):
                    if dados['teamA'] and dados['teamA'] in linha and dados['teamB'] and dados['teamB'] in linha:
                        indice_times = i
                        break
                
                for i, linha in enumerate(linhas):
                    if indice_times >= 0 and abs(i - indice_times) > 5:
                        continue
                    
                    if ' / ' in linha and any(sport in linha.lower() for sport in [
                        'futebol', 'football', 'soccer', 'basquete', 'basketball', 'basquetebol',
                        'tênis', 'tennis', 'hóquei', 'hockey', 'hoquei', 'beisebol', 'beisebal', 
                        'baseball', 'voleibol', 'volleyball', 'vôlei', 'volei', 'handball', 
                        'handebol', 'rugby', 'cricket', 'futsal'
                    ]):
                        partes = linha.split(' / ')
                        if len(partes) >= 2:
                            dados['sport'] = partes[0].strip()
                            dados['league'] = ' / '.join(partes[1:]).strip()
                        break
                
                if not dados['sport'] and dados['teamA'] and indice_times >= 0:
                    for i in range(indice_times + 1, min(indice_times + 4, len(linhas))):
                        linha = linhas[i]
                        
                        if (' / ' in linha and 
                            'Evento' not in linha and 
                            'ROI' not in linha and
                            '–' not in linha and
                            '%' not in linha and
                            'USD' not in linha and
                            'BRL' not in linha and
                            'Chance' not in linha and
                            'Aposta' not in linha and
                            not re.search(r'\d+\.\d{2,}', linha)):
                            
                            partes = linha.split(' / ')
                            if len(partes) >= 2:
                                possivel_esporte = partes[0].strip()
                                possivel_liga = ' / '.join(partes[1:]).strip()
                                
                                if (len(possivel_esporte) < 30 and 
                                    possivel_esporte and 
                                    not re.search(r'\d{2,}', possivel_esporte)):
                                    dados['sport'] = possivel_esporte
                                    dados['league'] = possivel_liga
                                    break
                
                apostas_encontradas = []
                
                i = 0
                while i < len(linhas):
                    linha = linhas[i]
                    
                    casa_encontrada = detectar_casa_apostas(linha)
                    
                    if casa_encontrada:
                        texto_aposta = linha
                        j = i + 1
                        
                        fragmentos_casa = []
                        linhas_usadas_fragmentos = set()
                        linhas_parcialmente_usadas = {}
                        
                        while j < len(linhas) and j < i + 4:
                            proxima_linha = linhas[j].strip()
                            
                            if not proxima_linha or proxima_linha in ['〉', '○', '●', '\uf35d', 'new']:
                                j += 1
                                continue
                            
                            if any(s in proxima_linha for s in ['USD', 'BRL', '●', '○', '\uf35d']) or re.search(r'\d+\.\d+', proxima_linha):
                                break
                            
                            if len(proxima_linha) < 30:
                                nova_casa = detectar_casa_apostas(proxima_linha)
                                
                                if not nova_casa:
                                    if re.match(r'^\([A-Z]{2}\)$', proxima_linha):
                                        fragmentos_casa.append(proxima_linha)
                                        linhas_usadas_fragmentos.add(j)
                                        j += 1
                                    elif len(proxima_linha.split()) == 1 and proxima_linha[0].isupper():
                                        fragmentos_casa.append(proxima_linha)
                                        linhas_usadas_fragmentos.add(j)
                                        j += 1
                                    elif proxima_linha[0].isupper():
                                        palavras_prox = proxima_linha.split()
                                        if palavras_prox[0][0].isupper() and not re.search(r'\b(gol|time|cantos?|escanteios?|acima|abaixo)\b', palavras_prox[0].lower()):
                                            fragmentos_casa.append(palavras_prox[0])
                                            resto = ' '.join(palavras_prox[1:])
                                            if resto:
                                                linhas_parcialmente_usadas[j] = resto
                                            linhas_usadas_fragmentos.add(j)
                                            j += 1
                                        else:
                                            break
                                    else:
                                        break
                                else:
                                    break
                            else:
                                break
                        
                        if fragmentos_casa:
                            casa_encontrada = casa_encontrada + ' ' + ' '.join(fragmentos_casa)
                        
                        if casa_encontrada.startswith('Marjo') and 'Sports' not in casa_encontrada:
                            for k in range(i, min(j, len(linhas))):
                                if 'Sports' in linhas[k]:
                                    casa_encontrada = 'Marjo Sports (BR)'
                                    break
                        
                        while j < len(linhas) and j < i + 8:
                            proxima_linha = linhas[j]
                            
                            if j in linhas_usadas_fragmentos:
                                if j in linhas_parcialmente_usadas:
                                    texto_aposta += ' ' + linhas_parcialmente_usadas[j]
                                j += 1
                                continue
                            
                            palavras_linha = proxima_linha.strip().split()
                            if palavras_linha:
                                primeira_palavra = palavras_linha[0]
                                
                                if (len(primeira_palavra) >= 3 and 
                                    len(primeira_palavra) <= 15 and 
                                    primeira_palavra[0].isupper() and
                                    not re.search(r'\d+\.\d+', proxima_linha)):
                                    
                                    possivel_casa = detectar_casa_apostas(primeira_palavra)
                                    if possivel_casa:
                                        casa_atual_base = casa_encontrada.split()[0] if casa_encontrada else ""
                                        if casa_atual_base.lower() != primeira_palavra.lower():
                                            break
                            
                            casa_na_proxima = detectar_casa_apostas(proxima_linha)
                            if casa_na_proxima:
                                casa_atual_base = casa_encontrada.split()[0] if casa_encontrada else ""
                                casa_proxima_base = casa_na_proxima.split()[0] if casa_na_proxima else ""
                                
                                if casa_atual_base.lower() != casa_proxima_base.lower():
                                    break
                            
                            if any(keyword in proxima_linha for keyword in ['Aposta total', 'Mostrar', 'Use sua', 'Arredondar']):
                                break
                            
                            tem_dados_financeiros = any(keyword in proxima_linha for keyword in ['USD', 'BRL', '●', '○']) or re.search(r'\d+\.\d+', proxima_linha)
                            eh_continuacao_tipo = bool(re.search(r'\b(gol|time|cantos?|escanteios?|resultado|final|tempo|minuto|chute|corner|primeiro|segundo|1º|2º|over|under|acima|abaixo|casa|fora|empate|handicap)\b', proxima_linha.lower()))
                            eh_linha_curta = len(proxima_linha.split()) <= 6
                            
                            if tem_dados_financeiros or (eh_continuacao_tipo and eh_linha_curta):
                                texto_aposta += ' ' + proxima_linha
                                j += 1
                            else:
                                break
                        
                        aposta = processar_aposta_completa(texto_aposta, casa_encontrada)
                        if aposta and aposta['house'] and aposta['odd']:
                            apostas_encontradas.append(aposta)
                        
                        i = j
                    else:
                        i += 1
                
                if len(apostas_encontradas) >= 1:
                    dados['bet1'].update(apostas_encontradas[0])
                
                if len(apostas_encontradas) >= 2:
                    dados['bet2'].update(apostas_encontradas[1])
                
                if len(apostas_encontradas) >= 3:
                    dados['bet3'].update(apostas_encontradas[2])
                
                bets_detected = len(apostas_encontradas)
                if dados['teamA'] and dados['teamB'] and dados['bet1']['house'] and dados['bet2']['house']:
                    if bets_detected < 3 or dados['bet3']['house']:
                        break
    
    except Exception as e:
        print(f"Erro ao processar PDF: {str(e)}")
    
    return dados


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            print("[PDF Service] Starting request processing", file=sys.stderr)
            
            if not pdfplumber:
                print("[PDF Service] ERROR: pdfplumber not installed", file=sys.stderr)
                self.send_error_response(500, 'pdfplumber not installed')
                return
                
            content_length = int(self.headers.get('Content-Length', 0))
            
            if content_length == 0:
                print("[PDF Service] ERROR: No data provided", file=sys.stderr)
                self.send_error_response(400, 'No data provided')
                return
            
            print(f"[PDF Service] Content length: {content_length}", file=sys.stderr)
            
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
            except json.JSONDecodeError as e:
                print(f"[PDF Service] ERROR: Invalid JSON: {str(e)}", file=sys.stderr)
                self.send_error_response(400, f'Invalid JSON: {str(e)}')
                return
            
            if 'pdf' not in data:
                print("[PDF Service] ERROR: PDF field not found", file=sys.stderr)
                self.send_error_response(400, 'PDF not provided')
                return
            
            print("[PDF Service] PDF data received", file=sys.stderr)
            
            pdf_base64 = data['pdf']
            
            if ',' in pdf_base64:
                pdf_base64 = pdf_base64.split(',')[1]
            
            try:
                pdf_bytes = base64.b64decode(pdf_base64)
            except Exception as e:
                print(f"[PDF Service] ERROR: Invalid base64: {str(e)}", file=sys.stderr)
                self.send_error_response(400, f'Invalid base64 encoding: {str(e)}')
                return
            
            print(f"[PDF Service] PDF decoded, size: {len(pdf_bytes)} bytes", file=sys.stderr)
            
            result = extrair_dados_pdf_bytes(pdf_bytes)
            
            print(f"[PDF Service] Processing complete", file=sys.stderr)
            
            self.send_json_response(200, {
                'success': True,
                'data': result
            })
            
        except Exception as e:
            error_msg = str(e)
            stack_trace = traceback.format_exc()
            print(f"[PDF Service] ERROR: {error_msg}", file=sys.stderr)
            print(f"[PDF Service] Stack trace: {stack_trace}", file=sys.stderr)
            self.send_error_response(500, f'Error processing PDF: {error_msg}')
    
    def send_json_response(self, status_code, data):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response = json.dumps(data, ensure_ascii=False)
        self.wfile.write(response.encode('utf-8'))
    
    def send_error_response(self, status_code, message):
        self.send_json_response(status_code, {
            'success': False,
            'error': message
        })
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
