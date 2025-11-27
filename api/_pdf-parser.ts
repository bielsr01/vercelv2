// Using dynamic import for CommonJS module compatibility
let pdfParse: (dataBuffer: Buffer) => Promise<{ text: string; numpages: number; info: any }>;

async function initPdfParse() {
  if (!pdfParse) {
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    pdfParse = require('pdf-parse');
  }
  return pdfParse;
}

const KNOWN_HOUSES = new Map([
  ['kto', 'KTO (BR)'],
  ['bet365', 'Bet365 (BR)'],
  ['superbet', 'SuperBet (BR)'],
  ['super bet', 'SuperBet (BR)'],
  ['estrelabet', 'EstrelaBet (BR)'],
  ['estrela bet', 'EstrelaBet (BR)'],
  ['pinnacle', 'Pinnacle (BR)'],
  ['betano', 'Betano (BR)'],
  ['stake', 'Stake (BR)'],
  ['novibet', 'Novibet (BR)'],
  ['marjo sports', 'Marjo Sports (BR)'],
  ['marjosports', 'MarjoSports (BR)'],
  ['afun', 'Afun (BR)'],
  ['vivasorte', 'Vivasorte (BR)'],
  ['tab', 'Tab (AU)'],
  ['cloudbet', 'CloudBet'],
  ['cloud bet', 'CloudBet'],
  ['betmgm', 'Betmgm (BR)'],
  ['bet-bra sb', 'Bet-Bra SB (BR)'],
  ['bet-bra', 'Bet-Bra (BR)'],
]);

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

function normalizeText(texto: string): string {
  return texto
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/\u2013/g, '–')
    .replace(/\u2014/g, '–')
    .replace(/−/g, '-');
}

function cleanAndJoinLines(texto: string): string {
  const lines = texto.split('\n');
  const result: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    if (line === '(BR)' || line === '(CO)' || line === '(AU)' || line === '(PT)' ||
        line === 'Sports' || line === 'Bet') {
      if (result.length > 0) {
        result[result.length - 1] += ' ' + line;
        continue;
      }
    }
    
    result.push(line);
  }
  
  return result.join('\n');
}

function extractTeams(texto: string): { teamA: string | null; teamB: string | null } {
  const lines = texto.split('\n');
  
  for (const line of lines) {
    if (line.includes('–') && !line.includes('ROI') && !line.includes('Evento') && 
        !line.includes('Event') && !line.includes('USD') && !line.includes('BRL') &&
        !line.includes('Chance') && !line.includes('H1(') && !line.includes('H2(') &&
        !line.includes('Odds') && !line.match(/\d+\.\d+%\d/)) {
      
      const parts = line.split('–');
      if (parts.length >= 2) {
        let teamA = parts[0].trim();
        let teamB = parts.slice(1).join('–').trim();
        
        teamB = teamB.replace(/\s*\d+\.\d+%$/, '').trim();
        
        if (teamA.length >= 2 && teamB.length >= 2 && 
            !teamA.match(/^\d/) && !teamB.match(/^\d/) &&
            teamA.length < 60 && teamB.length < 60) {
          return { teamA, teamB };
        }
      }
    }
  }
  return { teamA: null, teamB: null };
}

function extractDate(texto: string): string | null {
  const match = texto.match(/\((\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/);
  if (match) {
    return `${match[1]}T${match[2]}`;
  }
  return null;
}

function extractProfitPercentage(texto: string): number | null {
  const lines = texto.split('\n');
  for (const line of lines) {
    const match = line.match(/^(\d+\.\d+)%$/);
    if (match && !line.includes('ROI')) {
      const num = parseFloat(match[1]);
      if (num > 0 && num < 100) {
        return num;
      }
    }
  }
  return null;
}

function extractSportLeague(texto: string): { sport: string | null; league: string | null } {
  const esportes = ['futebol', 'football', 'soccer', 'basquete', 'basketball',
                    'tênis', 'tennis', 'hóquei', 'hockey', 'cricket', 'futsal',
                    'voleibol', 'volleyball', 'handball', 'handebol', 'rugby'];
  
  const lines = texto.split('\n');
  for (const line of lines) {
    if (line.includes(' / ')) {
      const lower = line.toLowerCase();
      if (esportes.some(e => lower.includes(e))) {
        const parts = line.split(' / ');
        if (parts.length >= 2) {
          return {
            sport: parts[0].trim(),
            league: parts.slice(1).join(' / ').trim()
          };
        }
      }
    }
  }
  return { sport: null, league: null };
}

function findHouse(text: string): string | null {
  const lower = text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ');
  
  for (const [key, value] of KNOWN_HOUSES) {
    if (lower.includes(key)) {
      return value;
    }
  }
  
  return null;
}

function extractDataNumbers(texto: string): number[] {
  const numbers: number[] = [];
  
  const dataMatch = texto.match(/Arredondar.*?(\d[\d\s\n.,〉]+)/s);
  if (dataMatch) {
    const dataSection = dataMatch[1];
    const allNums = dataSection.match(/\d+\.?\d*/g) || [];
    for (const n of allNums) {
      const num = parseFloat(n);
      if (num > 0 && !isNaN(num)) {
        numbers.push(num);
      }
    }
  }
  
  if (numbers.length === 0) {
    const compactMatch = texto.matchAll(/(\d+\.\d{2,3})(\d+\.?\d*)/g);
    for (const m of compactMatch) {
      const odd = parseFloat(m[1]);
      const stake = parseFloat(m[2]);
      if (odd >= 1 && odd <= 50 && stake > 0) {
        numbers.push(odd, stake);
      }
    }
  }
  
  return numbers;
}

function extractBets(texto: string): BetData[] {
  const cleanedText = cleanAndJoinLines(texto);
  const lines = cleanedText.split('\n').map(l => l.trim()).filter(l => l);
  
  const bets: BetData[] = [];
  const dataNumbers = extractDataNumbers(texto);
  
  let betIndex = 0;
  let currentBet: Partial<BetData> | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('Aposta total') || line.includes('Total stake') ||
        line.includes('Mostrar') || line.includes('Arredondar')) {
      break;
    }
    
    const house = findHouse(line);
    if (house) {
      if (currentBet && currentBet.house) {
        const oddIndex = betIndex * 2;
        const stakeIndex = betIndex * 2 + 1;
        
        bets.push({
          house: currentBet.house,
          type: currentBet.type || null,
          odd: dataNumbers[oddIndex] || null,
          stake: dataNumbers[stakeIndex] || null,
          profit: currentBet.profit || null
        });
        betIndex++;
      }
      
      let betType = line;
      const houseInLine = house.replace(/\s*\([A-Z]+\)$/, '');
      betType = betType.replace(new RegExp(houseInLine.split(' ')[0], 'i'), '').trim();
      betType = betType.replace(/\([A-Z]{2}\)/g, '').trim();
      betType = betType.replace(/^[⚠○●\s]+/, '').replace(/[⚠○●\s]+$/, '').trim();
      
      currentBet = {
        house: house,
        type: betType || null,
        profit: null
      };
      
      for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
        const nextLine = lines[j];
        
        if (findHouse(nextLine)) break;
        if (nextLine.includes('Aposta total') || nextLine.includes('Mostrar')) break;
        if (nextLine === 'USD' || nextLine === 'BRL') continue;
        if (nextLine === '○' || nextLine === '●' || nextLine === '⚠') continue;
        if (nextLine === 'Lucro' || nextLine === 'Profit') continue;
        if (nextLine === 'D C' || nextLine === 'D   C' || nextLine === 'D F') continue;
        if (nextLine === 'Chance' || nextLine === 'Odds' || nextLine === 'Aposta' || nextLine === 'Stake') continue;
        if (nextLine === 'Com comissão') continue;
        
        const profitMatch = nextLine.match(/^(\d+\.\d{2})$/);
        if (profitMatch) {
          const num = parseFloat(profitMatch[1]);
          if (num < 1000) {
            currentBet.profit = num;
          }
          continue;
        }
        
        if (/^\d+\.\d+$/.test(nextLine) || /^\d+\.\d+%/.test(nextLine)) continue;
        
        if (nextLine.length < 50 && !nextLine.includes('ROI')) {
          currentBet.type = ((currentBet.type || '') + ' ' + nextLine).trim();
        }
      }
      
      continue;
    }
  }
  
  if (currentBet && currentBet.house) {
    const oddIndex = betIndex * 2;
    const stakeIndex = betIndex * 2 + 1;
    
    bets.push({
      house: currentBet.house,
      type: currentBet.type || null,
      odd: dataNumbers[oddIndex] || null,
      stake: dataNumbers[stakeIndex] || null,
      profit: currentBet.profit || null
    });
  }
  
  return bets;
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
    const parser = await initPdfParse();
    const pdfData = await parser(pdfBuffer);
    const texto = normalizeText(pdfData.text);
    
    if (!texto) {
      return dados;
    }
    
    dados.date = extractDate(texto);
    
    const teams = extractTeams(texto);
    dados.teamA = teams.teamA;
    dados.teamB = teams.teamB;
    
    dados.profitPercentage = extractProfitPercentage(texto);
    
    const sportLeague = extractSportLeague(texto);
    dados.sport = sportLeague.sport;
    dados.league = sportLeague.league;
    
    const bets = extractBets(texto);
    
    if (bets.length >= 1) dados.bet1 = bets[0];
    if (bets.length >= 2) dados.bet2 = bets[1];
    if (bets.length >= 3) dados.bet3 = bets[2];
    
  } catch (error) {
    console.error('[PDF Parser] Error processing PDF:', error);
  }
  
  return dados;
}
