import type { OCRResult } from "@shared/schema";

interface MistralFileResponse {
  id: string;
  object: string;
  bytes: number;
  created_at: number;
  filename: string;
  purpose: string;
}

interface OCRPageObject {
  index: number;
  markdown: string;
  images: any[];
  dimensions: {
    dpi: number;
    height: number;
    width: number;
  };
}

interface MistralOCRResponse {
  model: string;
  pages: OCRPageObject[];
  usage_info: {
    pages_processed: number;
    doc_size_bytes: number;
  };
}

export class OCRService {
  private apiKey: string;
  private baseUrl = "https://api.mistral.ai/v1";
  private maxRetries = 3;
  private retryDelay = 2000;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async uploadFile(fileBuffer: Buffer, filename: string): Promise<string> {
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: 'application/pdf' });
    formData.append('file', blob, filename);
    formData.append('purpose', 'ocr');

    const response = await fetch(`${this.baseUrl}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mistral Files API error: ${response.status} - ${errorText}`);
    }

    const data: MistralFileResponse = await response.json();
    return data.id;
  }

  async processDocument(fileBuffer: Buffer, mimeType: string, customPrompt?: string): Promise<OCRResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`OCR attempt ${attempt}/${this.maxRetries} - Processing ${mimeType}`);
        
        const fileId = await this.uploadFile(fileBuffer, 'document.pdf');
        console.log(`Uploaded PDF with file ID: ${fileId}`);

        const response = await fetch(`${this.baseUrl}/ocr`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: "mistral-ocr-latest",
            document: {
              type: "file",
              file_id: fileId
            }
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Mistral OCR API Error (attempt ${attempt}):`, errorText);
          
          if (response.status === 500 || response.status === 503) {
            lastError = new Error(`Mistral OCR API temporarily unavailable: ${response.status}`);
            if (attempt < this.maxRetries) {
              const delay = this.retryDelay * Math.pow(2, attempt - 1);
              console.log(`Retrying in ${delay}ms...`);
              await this.sleep(delay);
              continue;
            }
          }
          throw new Error(`Mistral OCR API error: ${response.status} - ${errorText}`);
        }

        const data: MistralOCRResponse = await response.json();
        console.log(`OCR processed ${data.pages?.length || 0} pages`);

        const allText = data.pages?.map(p => p.markdown).join('\n\n') || '';
        console.log('OCR Raw Text:', allText.substring(0, 2000));

        return this.parseOCRText(allText);

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`OCR attempt ${attempt} failed:`, lastError.message);
        
        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          console.log(`Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    throw new Error(`Failed after ${this.maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
  }

  private parseOCRText(text: string): OCRResult {
    console.log('Parsing OCR text...');
    
    let date: string | null = null;
    const datePatterns = [
      /Evento\s*\((\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/i,
      /(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/,
      /(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2})/,
    ];
    
    for (const pattern of datePatterns) {
      const dateMatch = text.match(pattern);
      if (dateMatch) {
        if (dateMatch[1].includes('/')) {
          const [day, month, year] = dateMatch[1].split('/');
          date = `${year}-${month}-${day}T${dateMatch[2]}`;
        } else {
          date = `${dateMatch[1]}T${dateMatch[2]}`;
        }
        break;
      }
    }

    let sport: string | null = null;
    const sportMap: { [key: string]: string } = {
      'futebol': 'Futebol',
      'football': 'Futebol',
      'soccer': 'Futebol',
      'basquete': 'Basquete',
      'basketball': 'Basquete',
      'tênis': 'Tênis',
      'tennis': 'Tênis',
      'hóquei': 'Hóquei',
      'hockey': 'Hóquei',
      'vôlei': 'Vôlei',
      'volleyball': 'Vôlei',
      'beisebol': 'Beisebol',
      'baseball': 'Beisebol',
      'mma': 'MMA',
      'ufc': 'MMA',
      'handebol': 'Handebol',
      'handball': 'Handebol',
      'esports': 'eSports',
      'e-sports': 'eSports',
    };
    
    const lowerText = text.toLowerCase();
    for (const [key, value] of Object.entries(sportMap)) {
      if (lowerText.includes(key)) {
        sport = value;
        break;
      }
    }

    let league: string | null = null;
    const leagueMatch = text.match(/(?:\/|·)\s*([A-Za-zÀ-ÿ\s\-]+(?:League|Cup|Championship|Liga|Division|Campeonato|Hockey League|NBA|NFL|NHL|MLB))/i);
    if (leagueMatch) {
      league = leagueMatch[1].trim();
    } else {
      const altLeagueMatch = text.match(/(?:Hóquei|Futebol|Basquete|Tênis)\s*\/\s*([^\n|%]+)/i);
      if (altLeagueMatch) {
        league = altLeagueMatch[1].trim().split(/\s+\d/).shift()?.trim() || null;
      }
    }

    let teamA: string | null = null;
    let teamB: string | null = null;
    
    const titleMatch = text.match(/^#\s*(.+?)\s*[-–—]\s*(.+?)$/m);
    if (titleMatch) {
      teamA = titleMatch[1].trim();
      teamB = titleMatch[2].trim();
    } else {
      const vsMatch = text.match(/([A-Za-zÀ-ÿ\s\(\)]+)\s+(?:vs?\.?|x|-)\s+([A-Za-zÀ-ÿ\s\(\)]+)/i);
      if (vsMatch) {
        teamA = vsMatch[1].trim();
        teamB = vsMatch[2].trim();
      }
    }

    let profitPercentage: number | null = null;
    const profitPatterns = [
      /\*\*(\d+[.,]\d+)%\*\*/,
      /(\d+[.,]\d+)%\s*\n.*ROI/i,
      /^(\d+[.,]\d+)%$/m,
    ];
    
    for (const pattern of profitPatterns) {
      const match = text.match(pattern);
      if (match) {
        const value = parseFloat(match[1].replace(',', '.'));
        if (value > 0 && value < 50) {
          profitPercentage = value;
          break;
        }
      }
    }

    let bets = this.extractBetsFromTable(text);
    
    if (bets.length < 2 || !bets[0]?.odd || !bets[1]?.odd) {
      const textBets = this.extractBetsFromText(text);
      
      if (textBets.length >= 2) {
        const validTextBets = textBets.filter(b => b.house && b.odd);
        if (validTextBets.length >= 2) {
          bets = validTextBets;
        } else if (textBets.length > bets.length) {
          bets = textBets;
        }
      }
      
      if (bets.length === 1 && textBets.length >= 1) {
        for (const tb of textBets) {
          if (tb.house && tb.house.toLowerCase() !== bets[0]?.house?.toLowerCase()) {
            bets.push(tb);
            if (bets.length >= 2) break;
          }
        }
      }
    }
    
    const result: OCRResult = {
      date,
      sport,
      league,
      teamA,
      teamB,
      bet1: bets[0] || { house: null, odd: null, type: null, stake: null, profit: null },
      bet2: bets[1] || { house: null, odd: null, type: null, stake: null, profit: null },
      profitPercentage,
    };

    if (bets[2]) {
      result.bet3 = bets[2];
    }

    console.log('Parsed result:', JSON.stringify(result, null, 2));
    return result;
  }

  private extractBetsFromTable(text: string): Array<{house: string | null, odd: number | null, type: string | null, stake: number | null, profit: number | null}> {
    const bets: Array<{house: string | null, odd: number | null, type: string | null, stake: number | null, profit: number | null}> = [];
    
    const knownHouses = [
      'Pinnacle', 'Bet365', 'Betano', 'EstrelaBet', 'SuperBet', 'Super Bet', 'KTO', 'Novibet',
      'Betmgm', 'BetMGM', 'DraftKings', 'FanDuel', 'PointsBet', 'Caesars', 'BetRivers',
      'Unibet', 'William Hill', 'Ladbrokes', 'Coral', 'Paddy Power', 'Betfair',
      'Sportsbet', 'Bwin', '1xBet', 'Melbet', 'Stake', 'Cloudbet', 'Bovada',
      'BetOnline', 'MyBookie', 'Betway', 'bet365', 'Betfred', 'SkyBet',
      'Brazino', 'Blaze', 'Pixbet', 'Sportingbet', 'Betclic', 'Betsson',
      'Rivalry', 'Esportes da Sorte', 'Parimatch', 'BetWinner', 'Leon',
      'Marathonbet', 'Fonbet', 'Vulkan', 'Brazino777',
      'RealsBet', 'BetPix', 'Galera Bet', 'VBet', 'Betmotion', 'Solverde',
      'Ivibet', 'FairPlay', '22Bet', 'Inplaybet', 'BravoBet', 'BetUp',
    ];

    const normalizedText = text.replace(/Super\s*\n\s*Bet/gi, 'SuperBet');

    const tableRows = normalizedText.split('\n').filter(line => line.includes('|'));
    
    for (const row of tableRows) {
      const cells = row.split('|').map(c => c.trim()).filter(c => c && c !== '---');
      
      if (cells.length < 3) continue;
      
      let foundHouse: string | null = null;
      let houseIndex = -1;
      
      for (let i = 0; i < cells.length; i++) {
        for (const house of knownHouses) {
          if (cells[i].toLowerCase().includes(house.toLowerCase())) {
            const countryMatch = cells[i].match(/\([A-Z]{2}\)/);
            foundHouse = house + (countryMatch ? ' ' + countryMatch[0] : '');
            houseIndex = i;
            break;
          }
        }
        if (foundHouse) break;
      }
      
      if (!foundHouse) continue;
      
      const bet: {house: string | null, odd: number | null, type: string | null, stake: number | null, profit: number | null} = {
        house: foundHouse,
        odd: null,
        type: null,
        stake: null,
        profit: null,
      };
      
      for (let i = 0; i < cells.length; i++) {
        if (i === houseIndex) continue;
        
        const cell = cells[i];
        
        if (!bet.type && /[A-Za-zÀ-ÿ]/.test(cell) && !/^\d+$/.test(cell) && !cell.match(/^(USD|BRL|R\$|\d+)$/)) {
          const typePatterns = [
            /(?:Acima|Over|Mais de)\s*[\d.,]+/i,
            /(?:Abaixo|Under|Menos de)\s*[\d.,]+/i,
            /H[12]\s*[\(\[]?[+-]?[\d.,]+[\)\]]?/i,
            /[12]\s*\/\s*DNB/i,
            /DNB/i,
            /1X2/i,
            /ML/i,
            /Empate|Draw|X/i,
          ];
          
          for (const pattern of typePatterns) {
            if (pattern.test(cell)) {
              bet.type = cell;
              break;
            }
          }
          
          if (!bet.type && cell.length > 1 && cell.length < 50) {
            bet.type = cell;
          }
        }
        
        const numbers = cell.match(/(\d+[.,]?\d*)/g);
        if (numbers) {
          for (const numStr of numbers) {
            const num = parseFloat(numStr.replace(',', '.'));
            
            if (!bet.odd && num >= 1.01 && num <= 100 && !cell.includes('USD') && !cell.includes('BRL')) {
              bet.odd = num;
            }
            else if (!bet.stake && num > 1 && (cell.includes('USD') || cell.includes('BRL') || cell.includes('R$') || num > 10)) {
              bet.stake = num;
            }
            else if (!bet.profit && num > 0 && num < 1000 && i === cells.length - 1) {
              bet.profit = num;
            }
          }
        }
      }
      
      if (bet.house && (bet.odd || bet.type)) {
        bets.push(bet);
      }
    }

    if (bets.length === 0) {
      return this.extractBetsFromText(text);
    }

    return bets;
  }

  private extractBetsFromText(text: string): Array<{house: string | null, odd: number | null, type: string | null, stake: number | null, profit: number | null}> {
    const bets: Array<{house: string | null, odd: number | null, type: string | null, stake: number | null, profit: number | null}> = [];
    
    const normalizedText = text
      .replace(/Super\s*\n?\s*Bet/gi, 'SuperBet')
      .replace(/Bet\s*\n?\s*(\([A-Z]{2}\))/gi, 'Bet$1')
      .replace(/\*\*/g, '')
      .replace(/- \*\*/g, '')
      .replace(/\n- /g, '\n')
      .replace(/\s+/g, ' ');
    
    const knownHouses = [
      'Pinnacle', 'Bet365', 'Betano', 'EstrelaBet', 'SuperBet', 'Super Bet', 'KTO', 'Novibet',
      'Betmgm', 'BetMGM', 'DraftKings', 'FanDuel', 'PointsBet', 'Caesars', 'BetRivers',
      'Unibet', 'William Hill', 'Ladbrokes', 'Coral', 'Paddy Power', 'Betfair',
      'Sportsbet', 'Bwin', '1xBet', 'Melbet', 'Stake', 'Cloudbet', 'Bovada',
      'BetOnline', 'MyBookie', 'Betway', 'bet365', 'Betfred', 'SkyBet',
      'Brazino', 'Blaze', 'Pixbet', 'Sportingbet', 'Betclic', 'Betsson',
      'Rivalry', 'Esportes da Sorte', 'Parimatch', 'BetWinner', 'Leon',
      'Marathonbet', 'Fonbet', 'Vulkan', 'Brazino777',
      'RealsBet', 'BetPix', 'Galera Bet', 'VBet', 'Betmotion', 'Solverde',
      'Ivibet', 'FairPlay', '22Bet', 'Inplaybet', 'BravoBet', 'BetUp',
    ];

    const housePositions: { house: string, position: number }[] = [];
    
    for (const house of knownHouses) {
      const escapedHouse = house.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const houseRegex = new RegExp(`(${escapedHouse})(?:\\s*\\([A-Z]{2}\\))?`, 'gi');
      let match;
      
      while ((match = houseRegex.exec(normalizedText)) !== null) {
        const alreadyFound = housePositions.some(h => 
          Math.abs(h.position - match!.index) < 10 || 
          h.house.toLowerCase().replace(/\s+/g, '') === match![0].toLowerCase().replace(/\s+/g, '')
        );
        
        if (!alreadyFound) {
          housePositions.push({ house: match[0], position: match.index });
        }
      }
    }
    
    housePositions.sort((a, b) => a.position - b.position);
    
    for (let i = 0; i < housePositions.length; i++) {
      const { house, position } = housePositions[i];
      const nextPosition = housePositions[i + 1]?.position || normalizedText.length;
      const contextEnd = Math.min(position + 400, nextPosition);
      const context = normalizedText.substring(position, contextEnd);
      
      const bet: {house: string | null, odd: number | null, type: string | null, stake: number | null, profit: number | null} = {
        house: house,
        odd: null,
        type: null,
        stake: null,
        profit: null,
      };
      
      const typePatterns = [
        /H[12]\s*[\(\[]?[+-]?\s*[\d.,]+[\)\]]?\s*(?:Tempo Extra)?/i,
        /(?:Acima|Over)\s*[\d.,]+/i,
        /(?:Abaixo|Under)\s*[\d.,]+/i,
        /[12]\s*\/\s*(?:DNB|ANB)/i,
        /[12]-[12]\s*(?:Tempo Extra)?/i,
        /Mais de\s*[\d.,]+/i,
        /Menos de\s*[\d.,]+/i,
        /Total\s*(?:Acima|Abaixo|Over|Under)/i,
        /DNB/i,
        /ML/i,
        /Moneyline/i,
        /1X2/i,
      ];
      
      for (const pattern of typePatterns) {
        const typeMatch = context.match(pattern);
        if (typeMatch) {
          bet.type = typeMatch[0].trim();
          break;
        }
      }
      
      const stakePattern = /(\d+(?:[.,]\d+)?)\s*(?:USD|BRL|R\$)/gi;
      const stakeMatches = [...context.matchAll(stakePattern)];
      if (stakeMatches.length > 0) {
        bet.stake = parseFloat(stakeMatches[0][1].replace(',', '.'));
      }
      
      const profitPattern = /(?:lucro|profit)[:\s]*(\d+[.,]\d+)/gi;
      const profitMatch = context.match(profitPattern);
      if (profitMatch) {
        const numMatch = profitMatch[0].match(/(\d+[.,]\d+)/);
        if (numMatch) {
          bet.profit = parseFloat(numMatch[1].replace(',', '.'));
        }
      }
      
      const allNumbers = context.match(/(\d+[.,]\d{1,3})/g) || [];
      const candidates: number[] = [];
      
      for (const numStr of allNumbers) {
        const num = parseFloat(numStr.replace(',', '.'));
        if (num >= 1.01 && num <= 50 && !candidates.includes(num)) {
          candidates.push(num);
        }
      }
      
      if (candidates.length > 0) {
        candidates.sort((a, b) => a - b);
        bet.odd = candidates.find(n => n >= 1.2 && n <= 10) || candidates[0];
      }
      
      if (!bet.stake) {
        for (const numStr of allNumbers) {
          const num = parseFloat(numStr.replace(',', '.'));
          if (num > 50 && num < 100000 && num !== bet.odd) {
            bet.stake = num;
            break;
          }
        }
      }
      
      if (bet.house && bet.odd) {
        bets.push(bet);
      } else if (bet.house && bet.stake) {
        bets.push(bet);
      }
    }

    return bets;
  }

  async processImage(imageBase64: string, customPrompt?: string): Promise<OCRResult> {
    const buffer = Buffer.from(imageBase64, 'base64');
    return this.processDocument(buffer, 'image/jpeg', customPrompt);
  }

  async processImageFromBuffer(imageBuffer: Buffer, customPrompt?: string): Promise<OCRResult> {
    return this.processDocument(imageBuffer, 'image/jpeg', customPrompt);
  }

  async processFileFromBuffer(fileBuffer: Buffer, mimeType: string, customPrompt?: string): Promise<OCRResult> {
    return this.processDocument(fileBuffer, mimeType, customPrompt);
  }

  async processPDF(pdfBuffer: Buffer, customPrompt?: string): Promise<OCRResult> {
    return this.processDocument(pdfBuffer, 'application/pdf', customPrompt);
  }
}
