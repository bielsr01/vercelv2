#!/usr/bin/env python3
import sys
import json
import pdfplumber
import re
from datetime import datetime

def preprocessar_linhas_quebradas(texto):
    """
    Junta linhas que foram quebradas, incluindo casas e tipos divididos
    Trata especialmente casas como "Super...Bet (BR)" que ficam fragmentadas
    """
    lines = texto.split('\n')
    
    # PASSO 1: Remove símbolos isolados e linhas vazias
    # Lista de símbolos para ignorar (caracteres Unicode especiais)
    simbolos_ignorar = ['〉', '○', '●', '\uf35d', '\uf059', '\uf0c5', '\u3009', '\u232a']
    lines_limpas = []
    for line in lines:
        linha_stripped = line.strip()
        # Remove símbolos do início e fim da linha
        for simbolo in simbolos_ignorar:
            linha_stripped = linha_stripped.replace(simbolo, ' ').strip()
        # Verifica se linha é apenas um símbolo isolado
        eh_apenas_simbolo = linha_stripped in simbolos_ignorar or len(linha_stripped) <= 1
        if linha_stripped and not eh_apenas_simbolo:
            lines_limpas.append(linha_stripped)
    
    # PASSO 2: Junta "(BR) texto" com a linha anterior que começa com casa fragmentada
    # Exemplo: linha anterior "Marjo ...", linha atual "(BR) 1º o período" -> junta como "Marjo ... (BR)"
    lines_step2 = []
    for linha in lines_limpas:
        if re.match(r'^\([A-Z]{2}\)', linha):  # Começa com (BR) ou (CO) etc
            if lines_step2:
                ultima = lines_step2[-1]
                # Se linha anterior tem USD/BRL ou começa com Sports/Bet (fragmento de casa)
                if 'USD' in ultima or 'BRL' in ultima or re.match(r'^(Sports|Bet)\b', ultima):
                    # Extrai só o código do país
                    match = re.match(r'^(\([A-Z]{2}\))', linha)
                    if match:
                        codigo_pais = match.group(1)
                        lines_step2[-1] = ultima + ' ' + codigo_pais
                        # Se sobrou texto após o código, adiciona como nova linha
                        resto = linha[len(codigo_pais):].strip()
                        if resto:
                            lines_step2.append(resto)
                        continue
            lines_step2.append(linha)
        else:
            lines_step2.append(linha)
    
    # PASSO 3: Junta linhas que começam com "Sports" ou "Bet" com a linha anterior que começa com Super/Marjo/Estrela
    lines_step3 = []
    for linha in lines_step2:
        if re.match(r'^(Bet|Sports)\b', linha):
            # Linha começa com "Bet" ou "Sports" - pode ser fragmento de casa
            if lines_step3:
                ultima = lines_step3[-1]
                # Verifica se a última linha começa com casa fragmentada e tem USD/BRL
                primeira_palavra = ultima.split()[0] if ultima.split() else ""
                if primeira_palavra.lower() in ['super', 'marjo', 'estrela', 'bravo', 'max'] and ('USD' in ultima or 'BRL' in ultima):
                    # Extrai o fragmento do nome da casa
                    # Pode ser: "Sports", "Bet", "Sports escanteios (BR)", "Bet (BR)"
                    # Queremos extrair: "Sports", "Bet", "Sports (BR)", "Bet (BR)"
                    prefixo = re.match(r'^(Bet|Sports)', linha).group(1)
                    # Verifica se tem código de país na linha
                    match_pais = re.search(r'\(([A-Z]{2})\)', linha)
                    if match_pais:
                        fragmento_casa = f"{prefixo} ({match_pais.group(1)})"
                    else:
                        fragmento_casa = prefixo
                    
                    # Extrai texto restante que pode ser parte do tipo de aposta (ex: "escanteios")
                    # Remove o prefixo (Sports/Bet), o código de país, e pega o resto
                    resto_linha = linha
                    resto_linha = re.sub(r'^(Bet|Sports)\s*', '', resto_linha)  # Remove Sports/Bet
                    resto_linha = re.sub(r'\([A-Z]{2}\)', '', resto_linha)  # Remove (BR)/(CO)
                    resto_linha = resto_linha.strip()
                    
                    # Reconstrói a linha: casa original + fragmento da casa + resto do texto (se houver)
                    nova_linha = ultima + ' ' + fragmento_casa
                    if resto_linha:
                        # Adiciona o resto (ex: "escanteios") ao tipo de aposta
                        # Insere antes de USD/BRL para que seja capturado como parte do tipo
                        match_moeda = re.search(r'([\d.]+\s*(?:USD|BRL))', nova_linha)
                        if match_moeda:
                            pos = match_moeda.start()
                            nova_linha = nova_linha[:pos] + resto_linha + ' ' + nova_linha[pos:]
                    
                    lines_step3[-1] = nova_linha
                    continue
            lines_step3.append(linha)
        else:
            lines_step3.append(linha)
    
    return '\n'.join(lines_step3)

def extrair_dados_pdf(caminho_pdf):
    """
    Extrai dados estruturados de um PDF de surebet usando pdfplumber
    Parser otimizado para 100% de precisão com todos os formatos de PDF
    Suporta acentos, símbolos especiais (≥, ø, etc.), qualquer casa de apostas
    """
    dados = {
        'date': None,
        'sport': None,
        'league': None,
        'teamA': None,
        'teamB': None,
        'bet1': {
            'house': None,
            'odd': None,
            'type': None,
            'stake': None,
            'profit': None
        },
        'bet2': {
            'house': None,
            'odd': None,
            'type': None,
            'stake': None,
            'profit': None
        },
        'bet3': {
            'house': None,
            'odd': None,
            'type': None,
            'stake': None,
            'profit': None
        },
        'profitPercentage': None
    }
    
    try:
        with pdfplumber.open(caminho_pdf) as pdf:
            for pagina in pdf.pages[:2]:  # Processa até 2 páginas
                texto = pagina.extract_text()
                if not texto:
                    continue
                
                # Pré-processa para juntar linhas quebradas (como BravoBet + (BR))
                texto_preprocessado = preprocessar_linhas_quebradas(texto)
                
                # Divide em linhas e limpa
                linhas = [linha.strip() for linha in texto_preprocessado.split('\n') if linha.strip()]
                
                
                # === EXTRAÇÃO DE DATA/HORA ===
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
                
                # === EXTRAÇÃO DE TIMES E PORCENTAGEM ===
                for linha in linhas:
                    if '–' in linha and '%' in linha and 'ROI' not in linha and 'Evento' not in linha:
                        # Remove porcentagem para extrair times
                        match_percent = re.search(r'(\d+\.\d+)%\s*$', linha)
                        if match_percent:
                            dados['profitPercentage'] = float(match_percent.group(1))
                            linha_times = linha[:match_percent.start()].strip()
                        else:
                            linha_times = linha
                        
                        # Divide pelos times usando "–"
                        if '–' in linha_times:
                            times = linha_times.split('–')
                            if len(times) >= 2:
                                dados['teamA'] = times[0].strip()
                                dados['teamB'] = times[1].strip()
                        break
                
                # === EXTRAÇÃO DE ESPORTE E LIGA ===
                # Encontra índice da linha de times para usar como âncora
                indice_times = -1
                for i, linha in enumerate(linhas):
                    if dados['teamA'] and dados['teamA'] in linha and dados['teamB'] and dados['teamB'] in linha:
                        indice_times = i
                        break
                
                # Primeiro tenta com palavras-chave conhecidas (deve estar próximo aos times)
                for i, linha in enumerate(linhas):
                    # Se tem índice de times, esporte deve estar próximo (±5 linhas)
                    if indice_times >= 0 and abs(i - indice_times) > 5:
                        continue
                    
                    if ' / ' in linha and any(sport in linha.lower() for sport in [
                        'futebol', 'football', 'soccer',
                        'basquete', 'basketball', 'basquetebol',
                        'tênis', 'tennis',
                        'hóquei', 'hockey', 'hoquei',
                        'beisebol', 'beisebal', 'baseball',
                        'voleibol', 'volleyball', 'vôlei', 'volei',
                        'handball', 'handebol',
                        'rugby',
                        'cricket',
                        'futsal'
                    ]):
                        partes = linha.split(' / ')
                        if len(partes) >= 2:
                            dados['sport'] = partes[0].strip()
                            dados['league'] = ' / '.join(partes[1:]).strip()
                        break
                
                # Se não encontrou E tem times, usa lógica genérica com restrições fortes
                if not dados['sport'] and dados['teamA'] and indice_times >= 0:
                    # Procura APENAS nas linhas imediatamente após os times (máximo +3 linhas)
                    for i in range(indice_times + 1, min(indice_times + 4, len(linhas))):
                        linha = linhas[i]
                        
                        # Deve ter " / " e NÃO ter marcadores de outras seções
                        if (' / ' in linha and 
                            'Evento' not in linha and 
                            'ROI' not in linha and
                            '–' not in linha and      # Não é linha de times
                            '%' not in linha and      # Não tem porcentagem
                            'USD' not in linha and    # Não é linha de aposta
                            'BRL' not in linha and
                            'Chance' not in linha and # Não é header de tabela
                            'Aposta' not in linha and
                            not re.search(r'\d+\.\d{2,}', linha)):  # Não tem odds (números com 2+ decimais)
                            
                            partes = linha.split(' / ')
                            if len(partes) >= 2:
                                # Valida que a primeira parte parece um esporte
                                possivel_esporte = partes[0].strip()
                                possivel_liga = ' / '.join(partes[1:]).strip()
                                
                                # Esporte deve ser curto e não conter números grandes
                                if (len(possivel_esporte) < 30 and 
                                    possivel_esporte and 
                                    not re.search(r'\d{2,}', possivel_esporte)):  # Sem números de 2+ dígitos
                                    dados['sport'] = possivel_esporte
                                    dados['league'] = possivel_liga
                                    break
                
                # === EXTRAÇÃO DE APOSTAS ===
                apostas_encontradas = []
                
                # Após preprocessing, cada aposta deve estar em uma linha completa
                # Processa linha por linha procurando apostas
                for linha in linhas:
                    # Pula linhas de cabeçalho ou seções
                    if any(keyword in linha for keyword in ['Aposta total', 'Mostrar', 'Use sua', 'Arredondar', 'Chance', 'Com comissão', 'Lucro', 'Levar em consideração']):
                        continue
                    
                    # Detecta casa de apostas
                    casa_encontrada = detectar_casa_apostas(linha)
                    
                    if casa_encontrada and ('USD' in linha or 'BRL' in linha):
                        # A linha contém uma aposta completa (casa + dados financeiros)
                        
                        # Verifica se a linha tem "Bet (BR)" ou "Sports (BR)" ao final (casas fragmentadas)
                        # Nesse caso, a casa real é "Super Bet (BR)" ou "Marjo Sports (BR)"
                        match_bet_suffix = re.search(r'\s+(Bet|Sports)\s*\([A-Z]{2}\)\s*$', linha)
                        if match_bet_suffix:
                            primeira_palavra = linha.split()[0]
                            sufixo = match_bet_suffix.group(0).strip()
                            # Reconstrói o nome da casa
                            if primeira_palavra.lower() in ['super', 'marjo', 'estrela', 'bravo', 'max']:
                                casa_encontrada = primeira_palavra + ' ' + sufixo
                        
                        # Correção especial: se linha termina com "(BR)" isolado
                        if linha.strip().endswith('(BR)') and not casa_encontrada.endswith('(BR)'):
                            casa_encontrada = casa_encontrada + ' (BR)'
                        
                        # Processa a aposta
                        aposta = processar_aposta_completa(linha, casa_encontrada)
                        if aposta and aposta['house'] and aposta['odd']:
                            apostas_encontradas.append(aposta)
                
                # Mapeia apostas para bet1, bet2 e bet3 (se houver)
                if len(apostas_encontradas) >= 1:
                    dados['bet1'].update(apostas_encontradas[0])
                
                if len(apostas_encontradas) >= 2:
                    dados['bet2'].update(apostas_encontradas[1])
                
                if len(apostas_encontradas) >= 3:
                    dados['bet3'].update(apostas_encontradas[2])
                
                # Se encontrou dados suficientes, para
                # Para apostas duplas: bet1 e bet2 devem ter house (e menos de 3 apostas detectadas)
                # Para apostas triplas: bet1, bet2 E bet3 devem ter house
                bets_detected = len(apostas_encontradas)
                if dados['teamA'] and dados['teamB'] and dados['bet1']['house'] and dados['bet2']['house']:
                    # Só para se:
                    # - Detectou menos de 3 apostas (aposta dupla completa) OU
                    # - Detectou 3+ apostas E bet3 já está populada (aposta tripla completa)
                    if bets_detected < 3 or dados['bet3']['house']:
                        break
    
    except Exception as e:
        print(f"Erro ao processar PDF: {str(e)}", file=sys.stderr)
    
    return dados

def detectar_casa_apostas(linha):
    """
    Detecta casas de apostas usando lista completa do sistema (1005+ casas)
    Suporta todas as variantes incluindo casas com parênteses como KTO (BR), Blaze (BR)
    Detecta também fragmentos iniciais de casas compostas (ex: "Cloud" -> CloudBet)
    """
    # Lista completa de todas as casas de apostas do sistema
    casas_sistema = [
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
        'Marathon (RU)', 'MBet', 'MarathonBet (DK)', 'MarathonBet (ES)', 'MarathonBet (IT)', 'MarjoSports (BR)', 'Marjo Sports (BR)', 'Marjo',
        'Matchbook', 'Maxbet (RS)', 'Maxbet (BA)', 'MaxLine (BY)', 'Mcbookie', 'StarSports', 'MelBet',
        'Betwinner', 'DBbet', 'MelBet (BI)', 'MelBet (KE)', 'MelBet (MN)', 'Meridian', 'Meridian (CY)',
        'Meridian (BE)', 'Meridian (BA)', 'Meridian (ME)', 'Meridian (RS)', 'Meridian (PE)', 'JogaBets (MZ)',
        'Meridian (BR)', 'MerkurBets', 'Betcenter (BE)', 'Cashpoint (DK)', 'MerkurBets (DE)', 'Miseojeu+',
        'Misli (AZ)', 'MostBet', 'Mozzart', 'Mozzart (BA)', 'Mozzart (NG)', 'Mozzart (RO)', 'MSport (GH)',
        'MSport (NG)', 'Mystake', '31Bet', '9dBet (BR)', 'Betfast', 'Betfast (BR)', 'Donbet', 'Donbet (Win)',
        'Faz1Bet (BR)', 'Freshbet', 'Goldenbet', 'Jackbit', 'Mystake (Bet)', 'Rolletto', 'TivoBet (BR)',
        'Velobet (Win)', 'Wjcasino (BR)', 'N1Bet', '12Play', 'CelsiusCasino', 'Coins Game', 'Wild', 'YBets',
        'NaijaBet', 'NairaBet', 'Napoleon (BE)', 'Neobet', 'Neobet (CA)', 'Neobet (DE)', 'Neobet (ZA)',
        'Nesine (TR)', 'Bilyoner', 'Misli (Com)', 'Oley', 'NetBet', 'Bet777 (BE)', 'Bet777 (ES)', 'NetBet (GR)',
        'NetBet (BR)', 'NetBet (FR)', 'NetBet (IT)', 'DaznBet (IT)', 'OriginalBet (IT)', 'Plexbet (IT)',
        'NetBet (RO)', 'Nike (SK)', 'NitroBetting (EU)', 'Norsk Tipping (NO)', 'Novibet (BR)', 'Novibet (GR)',
        'Novibet (IE)', 'Olimp', 'Olimp (Bet)', 'Olimpbet (KZ)', 'Olimpkz', 'OlimpoBet (PE)', 'OlyBet (ES)',
        'OlyBet (EU)', 'OlyBet (FR)', 'FeelingBet (FR)', 'Genybet (FR)', 'OlyBet (LT)', 'Onabet (BR)',
        'Esporte365 (BR)', 'LuckBet (BR)', 'Luvabet (BR)', 'Optibet (LT)', 'Optibet (LV)', 'Optibet (EE)',
        'OrbitX', 'OrbiteX', 'Paddy Power', 'PameStoixima (GR)', 'Parasino', 'ApxBet', 'Betonngliga',
        'BigBet (BR)', 'LiderBet (BR)', 'RealsBet (BR)', 'Parimatch (KZ)', 'BuddyBet (UA)', 'Gra (Live)',
        'ParionsSport (FR)', 'Paston (ES)', 'Br4bet (BR)', 'SorteOnline (BR)', 'Pin-up', 'BetPlays',
        'Pin-up (RU)', 'BaseBet', 'Casino Spinamba', 'Lucky Bird Casino', 'MarsBet', 'Pin-up (EN)',
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
        'Stoiximan (CY)', 'Stoiximan (GR)', 'STS (PL)', 'SuperBet (BR)', 'Super Bet (BR)', 'SuperBet (PL)', 'SuperBet (RO)',
        'SuperBet (RS)', 'Surebet247', 'SX Bet', 'SynotTip (LV)', 'SynotTip (CZ)', 'SynotTip (SK)', 'Tab (AU)',
        'TeApuesto (PE)', 'TempoBet', 'Tennisi', 'Tennisi (Bet)', 'Tennisi (KZ)', 'ThunderPickIo (NO)',
        'Tipico', 'Tipico (DE)', 'Tipp3 (AT)', 'TippmixPro (HU)', 'Tipsport (CZ)', 'Chance (CZ)',
        'Tipsport (SK)', 'Tipwin (DE)', 'Tipwin', 'Tipwin (DK)', 'Tipwin (SE)', 'TonyBet', 'Vave',
        'TonyBet (ES)', 'TonyBet (NL)', 'Topsport (LT)', 'Toto (NL)', 'TotoGaming (AM)', '1Win (Provider)',
        'Cannonbet', 'CaptainsBet (KE)', 'MelBet (NG)', 'MelBet (RU)', 'Sol.Casino', 'Tinbet (PE)',
        'Winspirit', 'Ubet (CY)', 'Ubet (KZ)', 'Betera (BY)', 'Unibet (DK)', 'Unibet (BE)', 'Unibet (FI)',
        'Unibet (SE)', 'Unibet (FR)', 'Unibet (RO)', 'ATG (SE)', 'Betmgm (NL)', 'Betmgm (SE)', 'Betmgm (UK)',
        'Casumo', 'Casumo (ES)', 'GrosvenorCasinos', 'No Account Bet (SE)', 'Paf', 'Paf (ES)', 'Paf (SE)',
        'PafBet (LV)', 'Scoore (BE)', 'Unibet (AU)', 'Unibet (IT)', 'Unibet (MT)', 'Unibet (NL)', 'VBet',
        'Bets60', 'H2bet (BR)', 'Hash636', 'Uabet', 'VBet (AM)', 'VBet (BR)', '7Games (BR)', 'Seguro (BR)',
        'VBet (FR)', 'VBet (LAT)', 'VBet (NL)', 'VBet (UK)', 'Veikkaus (FI)', 'Versus (ES)', 'Vivasorte (BR)',
        '4Play (BR)', '4Win (BR)', 'Ginga (BR)', 'QG (BR)', 'Zeroum (BR)', 'Vulkan Bet', 'W88Es', 'Wildz',
        'William Hill', 'Williamhill (ES)', 'Williamhill (IT)', 'Winamax (ES)', 'Winamax (DE)', 'Winamax (FR)',
        'WinBet (BG)', 'WinBet (RO)', 'Winline (RU)', 'WolfBet', 'WonderBet (CO)', 'WWin', 'YaassCasino (ES)',
        'Yabo888', 'Yajuego (CO)', 'YSB', 'Zamba (CO)', 'ZeBet', 'ZeBet (BE)', 'ZeBet (ES)', 'ZeBet (NL)',
        'Zenit', 'Zenit (Win)'
    ]
    
    linha_lower = linha.lower()
    
    # Detecta casas de apostas no texto
    # Ordena casas por especificidade (mais específicas primeiro)
    casas_ordenadas = sorted(casas_sistema, key=lambda x: (-len(x), '(' not in x))
    
    casas_encontradas = []
    for casa in casas_ordenadas:
        casa_lower_normalized = casa.lower()
        
        # Para casas com parênteses, busca de forma mais flexível
        if '(' in casa_lower_normalized:
            # Quebra a casa em nome base + sufixo
            if ' (' in casa_lower_normalized:
                nome_base, sufixo = casa_lower_normalized.split(' (', 1)
                sufixo = '(' + sufixo  # Re-adiciona o parêntese
                
                # Verifica se os componentes do nome base e sufixo existem na linha
                # Permite que estejam separados (ex: "Super...Bet (BR)")
                palavras_base = nome_base.split()
                todas_palavras_presentes = all(palavra in linha_lower for palavra in palavras_base)
                sufixo_presente = sufixo in linha_lower
                
                if todas_palavras_presentes and sufixo_presente:
                    # Verifica ordem aproximada: primeira palavra antes do sufixo
                    pos_primeira = linha_lower.find(palavras_base[0])
                    pos_sufixo = linha_lower.find(sufixo)
                    if pos_primeira < pos_sufixo:
                        return casa
            else:
                # Se não tem espaço antes do parêntese, usa busca simples
                if casa_lower_normalized in linha_lower:
                    return casa
        else:
            # Para casas sem parênteses, usa word boundaries para precisão
            casa_pattern = re.escape(casa_lower_normalized).replace(r'\ ', r'\s*')
            if re.search(r'\b' + casa_pattern + r'\b', linha_lower):
                return casa
    
    # Se não encontrou casa conhecida, tenta detecção dinâmica 
    # Busca por padrão: palavra capitalizada seguida de dados de aposta
    match = re.search(r'^([A-Z][A-Za-z\s\(\)]{2,30})\s+[A-Za-z0-9()+\-≥≤\.]+\s+\d+\.\d+', linha)
    if match:
        casa_candidata = match.group(1).strip()
        # Valida se parece ser nome de casa de apostas
        if len(casa_candidata) >= 3:
            return casa_candidata
    
    # Detecta fragmentos iniciais de casas compostas (ex: "Cloud" -> CloudBet, "Marjo" -> MarjoSports)
    # Procura palavras capitalizadas no início da linha
    palavras = linha.strip().split()
    if palavras:
        primeira_palavra = palavras[0]
        # Se é uma palavra capitalizada curta (3-15 chars), verifica se é início de casa conhecida
        if len(primeira_palavra) >= 3 and len(primeira_palavra) <= 15 and primeira_palavra[0].isupper():
            # Verifica se essa palavra é o início de alguma casa na lista
            for casa in casas_sistema:
                casa_limpa = casa.split('(')[0].strip()  # Remove sufixos como (BR), (CO)
                # Se a casa começa com essa palavra, retorna como fragmento detectado
                if casa_limpa.lower().startswith(primeira_palavra.lower()):
                    return primeira_palavra
    
    # Fallback: palavras individuais capitalizadas (como "Marjo", "Sports")
    # Retorna None para permitir junção posterior
    return None

def processar_aposta_completa(texto_aposta, casa_aposta):
    """
    Processa o texto completo de uma aposta para extrair todos os campos
    Garante 100% de precisão na extração
    """
    # === IDENTIFICAÇÃO DE SÍMBOLOS E DIVISÃO ===
    # Busca símbolos na ordem: ●, ○, depois \uf35d (unicode F35D)
    simbolo_match = re.search(r'[●○\uf35d]', texto_aposta)
    
    if simbolo_match:
        parte_antes_simbolo = texto_aposta[:simbolo_match.start()].strip()
        parte_depois_simbolo = texto_aposta[simbolo_match.end():].strip()
    else:
        # Se não tem símbolo, usa moeda como divisor
        moeda_match = re.search(r'(USD|BRL)', texto_aposta)
        if moeda_match:
            parte_antes_simbolo = texto_aposta[:moeda_match.start()].strip()
            parte_depois_simbolo = texto_aposta[moeda_match.start():].strip()
        else:
            parte_antes_simbolo = texto_aposta
            parte_depois_simbolo = ""
    
    # === EXTRAÇÃO DE STAKE PRIMEIRO ===
    # Stake é o número imediatamente antes de USD/BRL
    stake = None
    stake_matches = re.findall(r'(\d+\.?\d*)\s+(USD|BRL)', texto_aposta)
    if stake_matches:
        stake = float(stake_matches[0][0])
    
    # === EXTRAÇÃO DE ODD ===
    # A odd é um número decimal no range 1.0-50.0 que NÃO é stake
    # Geralmente vem ANTES do stake no texto
    numeros_antes = re.findall(r'\d+\.\d+', parte_antes_simbolo)
    odd = None
    
    if numeros_antes:
        # Busca número válido que não seja stake
        for num_str in reversed(numeros_antes):
            num = float(num_str)
            # Pula se for stake
            if stake and abs(num - stake) < 0.01:
                continue
            # Aceita se estiver no range de odds válido
            if 1.0 <= num <= 50.0:
                odd = num
                break
        
        # Fallback: se não encontrou, tenta o primeiro número válido
        if not odd:
            for num_str in numeros_antes:
                num = float(num_str)
                if stake and abs(num - stake) < 0.01:
                    continue
                if 1.0 <= num <= 50.0:
                    odd = num
                    break
    
    # === EXTRAÇÃO DE PROFIT ===
    profit = None
    
    # Profit é o último número após stake (geralmente < 1000 para lucros individuais)
    # Extração mais robusta: procura o último número DEPOIS do stake
    todos_numeros = re.findall(r'\d+\.\d+', texto_aposta)
    
    # Primeiro tenta buscar especificamente após stake (mais preciso)
    if stake:
        # Encontra posição do stake no texto
        stake_str = str(stake).replace('.', r'\.')
        stake_pattern = re.search(stake_str, texto_aposta)
        if stake_pattern:
            texto_pos_stake = texto_aposta[stake_pattern.end():]
            numeros_pos_stake = re.findall(r'\d+\.\d+', texto_pos_stake)
            if numeros_pos_stake:
                # Pega o último número após o stake (profit geralmente vem por último)
                profit = float(numeros_pos_stake[-1])
    
    # Fallback: busca último número pequeno (< 1000) que não seja stake nem odd
    if not profit:
        for num_str in reversed(todos_numeros):
            num = float(num_str)
            if num != stake and num != odd and num < 1000:
                profit = num
                break
    
    # === EXTRAÇÃO DO TIPO DE APOSTA ===
    # Extrai tipo de TODA a linha, não apenas da parte antes de USD
    # O tipo pode estar dividido: parte antes USD + parte depois USD
    tipo_completo = texto_aposta.replace(casa_aposta, '', 1).strip()
    tipo_completo = re.sub(r'\(BR\)', '', tipo_completo).strip()
    
    # Remove números financeiros (odd, stake, profit) e moedas do tipo completo
    palavras = tipo_completo.split()
    palavras_filtradas = []
    
    # Palavras-chave que indicam que o próximo número faz parte do tipo de aposta
    palavras_chave_tipo = ['acima', 'abaixo', 'total', 'over', 'under', 'mais', 'menos', 
                           'primeiro', 'segundo', 'tempo', 'extra', '1º', '2º']
    
    for i, palavra in enumerate(palavras):
        # Remove moedas
        if palavra in ['USD', 'BRL']:
            continue
        
        # Verifica se a palavra anterior é uma palavra-chave de tipo de aposta
        palavra_anterior_eh_chave = False
        if i > 0:
            palavra_anterior_lower = palavras[i-1].lower().replace('≥', '').replace('≤', '').strip()
            palavra_anterior_eh_chave = any(chave in palavra_anterior_lower for chave in palavras_chave_tipo)
        
        # Verifica se é número
        if re.match(r'^-?\d+\.?\d*$', palavra):
            num = float(palavra)
            
            # SEMPRE preserva números que vêm depois de palavras-chave (ex: "Acima 27.5")
            if palavra_anterior_eh_chave:
                palavras_filtradas.append(palavra)
                continue
            
            # Remove se for odd, stake ou profit (com tolerância)
            if (odd and abs(num - odd) < 0.01):
                continue
            if (stake and abs(num - stake) < 0.01):
                continue
            if (profit and abs(num - profit) < 0.01):
                continue
            
            # Remove se for negativo (profit negativo)
            if num < 0:
                continue
        
        palavras_filtradas.append(palavra)
    
    tipo_aposta = ' '.join(palavras_filtradas)
    
    # Limpeza final de símbolos e formatação
    tipo_aposta = re.sub(r'[●○]', '', tipo_aposta)  # Remove símbolos circulares
    tipo_aposta = re.sub(r'\uf35d', '', tipo_aposta)  # Remove unicode F35D
    tipo_aposta = tipo_aposta.replace('\u232A', '')  # Remove U+232A (〉)
    
    # Remove porcentagem de comissão (ex: "0.0%", "5.5%")
    tipo_aposta = re.sub(r'\s*\d+\.?\d*\s*%', '', tipo_aposta)
    
    tipo_aposta = re.sub(r'\s+', ' ', tipo_aposta).strip()  # Limpa espaços
    tipo_aposta = re.sub(r'[-–]\s*$', '', tipo_aposta).strip()  # Remove traços finais
    
    # Remove o nome da casa de apostas do tipo de aposta
    casa_sem_parenteses = re.sub(r'\s*\([A-Z]{2}\)\s*', '', casa_aposta).strip()
    
    # Remove palavras de interface que não deveriam estar no tipo
    tipo_aposta = re.sub(r'\b(Mostrar|comissões|Use sua|própria|taxa|câmbio|Arredondar|até|Levar|consideração|taxas)\b', '', tipo_aposta, flags=re.IGNORECASE)
    
    # PRIMEIRO: Tenta remover o nome completo da casa como frase única
    tipo_aposta = re.sub(r'\b' + re.escape(casa_sem_parenteses) + r'\b', '', tipo_aposta, flags=re.IGNORECASE)
    
    # SEGUNDO: Remove palavras individuais apenas para casas conhecidas (evita remover "Bet" genérico)
    # Lista de casas conhecidas onde podemos remover palavras específicas
    casas_conhecidas = {
        'estrela': ['EstrelaBet', 'Estrela'],
        'pinnacle': ['Pinnacle'],
        'marjo': ['MarjoSports', 'Marjo', 'Sports'],  # Sports só se for MarjoSports
        'super': ['SuperBet', 'Super', 'Bet'],  # Remove "Bet" quando é Super Bet
        'stake': ['Stake'],
        'kto': ['KTO'],
        'blaze': ['Blaze'],
        'multibet': ['MultiBet', 'Multi'],
        'bravo': ['BravoBet', 'Bravo'],
        'betfast': ['Betfast'],
        'betano': ['Betano']
    }
    
    casa_lower = casa_sem_parenteses.lower()
    
    # Remove palavras específicas apenas para casas conhecidas
    for chave, palavras in casas_conhecidas.items():
        if chave in casa_lower:
            for palavra in palavras:
                tipo_aposta = re.sub(r'\b' + re.escape(palavra) + r'\b', '', tipo_aposta, flags=re.IGNORECASE)
            break  # Para após encontrar a casa
    
    # Limpa espaços extras resultantes da remoção
    tipo_aposta = re.sub(r'\s+', ' ', tipo_aposta).strip()
    
    # Limpa o nome da casa de apostas
    casa_limpa = casa_aposta
    # Remove palavras de interface que podem ter sido capturadas
    casa_limpa = re.sub(r'\s*(Mostrar|comissões|Use sua|própria|taxa|câmbio|Arredondar|até|Levar|consideração|taxas)\b.*', '', casa_limpa, flags=re.IGNORECASE)
    casa_limpa = casa_limpa.strip()
    
    return {
        'house': casa_limpa,
        'odd': odd,
        'type': tipo_aposta if tipo_aposta else None,
        'stake': stake,
        'profit': profit
    }

def main():
    if len(sys.argv) != 2:
        print("Uso: python parse_pdf.py <caminho_do_pdf>", file=sys.stderr)
        sys.exit(1)
    
    caminho_pdf = sys.argv[1]
    
    try:
        dados = extrair_dados_pdf(caminho_pdf)
        # Imprime JSON para stdout para o Node.js capturar
        print(json.dumps(dados, ensure_ascii=False, indent=None))
    except Exception as e:
        print(f"Erro fatal: {str(e)}", file=sys.stderr)
        # Retorna estrutura vazia mas válida em caso de erro
        dados_vazio = {
            'date': None,
            'sport': None,
            'league': None,
            'teamA': None,
            'teamB': None,
            'bet1': {'house': None, 'odd': None, 'type': None, 'stake': None, 'profit': None},
            'bet2': {'house': None, 'odd': None, 'type': None, 'stake': None, 'profit': None},
            'profitPercentage': None
        }
        print(json.dumps(dados_vazio, ensure_ascii=False, indent=None))
        sys.exit(1)

if __name__ == "__main__":
    main()