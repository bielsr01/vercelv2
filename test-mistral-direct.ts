import fs from 'fs';
import path from 'path';
import { OCRService } from './server/ocr-service';

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

if (!MISTRAL_API_KEY) {
  console.error('ERROR: MISTRAL_API_KEY not set');
  process.exit(1);
}

const PDF_FILES = [
  'attached_assets/ssure01_1764217709964.pdf',
  'attached_assets/SSURE02_1764217709960.pdf',
  'attached_assets/sure 1_1764217709965.pdf',
  'attached_assets/sure01_1764217709965.pdf',
  'attached_assets/sure02_1764217709965.pdf',
  'attached_assets/sure03_1764217709965.pdf',
  'attached_assets/surte04_1764217709964.pdf',
  'attached_assets/t1_1764217709966.pdf',
  'attached_assets/t2_1764217709966.pdf',
  'attached_assets/t3_1764217709966.pdf',
  'attached_assets/t4_1764217709966.pdf',
  'attached_assets/0111_1764217709967.pdf',
  'attached_assets/01_1764217709967.pdf',
  'attached_assets/0222_1764217709967.pdf',
  'attached_assets/02_1764217709967.pdf',
  'attached_assets/03333_1764217709966.pdf',
  'attached_assets/1_1764217709967.pdf',
];

async function testOCR() {
  console.log('================================================================================');
  console.log('MISTRAL AI PIXTRAL OCR - DIRECT TEST');
  console.log('================================================================================\n');

  const ocrService = new OCRService(MISTRAL_API_KEY);
  
  let successCount = 0;
  let failCount = 0;

  for (const filePath of PDF_FILES) {
    if (!fs.existsSync(filePath)) {
      console.log(`[SKIP] File not found: ${filePath}`);
      continue;
    }

    const fileName = path.basename(filePath);
    console.log(`\n--------------------------------------------------------------------------------`);
    console.log(`Testing: ${fileName}`);
    console.log(`--------------------------------------------------------------------------------`);

    try {
      const fileBuffer = fs.readFileSync(filePath);
      
      const data = await ocrService.processDocument(fileBuffer, 'application/pdf');
      
      console.log('\n  EXTRACTED DATA:');
      console.log(`    Date: ${data.date || 'NOT FOUND'}`);
      console.log(`    Teams: ${data.teamA || '?'} vs ${data.teamB || '?'}`);
      console.log(`    Sport: ${data.sport || 'NOT FOUND'}`);
      console.log(`    League: ${data.league || 'NOT FOUND'}`);
      console.log(`    Profit %: ${data.profitPercentage || 'NOT FOUND'}`);
      
      console.log('\n  BET 1:');
      console.log(`    House: ${data.bet1?.house || 'NOT FOUND'}`);
      console.log(`    Type: ${data.bet1?.type || 'NOT FOUND'}`);
      console.log(`    Odd: ${data.bet1?.odd || 'NOT FOUND'}`);
      console.log(`    Stake: ${data.bet1?.stake || 'NOT FOUND'}`);
      console.log(`    Profit: ${data.bet1?.profit || 'NOT FOUND'}`);
      
      console.log('\n  BET 2:');
      console.log(`    House: ${data.bet2?.house || 'NOT FOUND'}`);
      console.log(`    Type: ${data.bet2?.type || 'NOT FOUND'}`);
      console.log(`    Odd: ${data.bet2?.odd || 'NOT FOUND'}`);
      console.log(`    Stake: ${data.bet2?.stake || 'NOT FOUND'}`);
      console.log(`    Profit: ${data.bet2?.profit || 'NOT FOUND'}`);

      if (data.bet3?.house || data.bet3?.type) {
        console.log('\n  BET 3:');
        console.log(`    House: ${data.bet3?.house || 'NOT FOUND'}`);
        console.log(`    Type: ${data.bet3?.type || 'NOT FOUND'}`);
        console.log(`    Odd: ${data.bet3?.odd || 'NOT FOUND'}`);
        console.log(`    Stake: ${data.bet3?.stake || 'NOT FOUND'}`);
        console.log(`    Profit: ${data.bet3?.profit || 'NOT FOUND'}`);
      }

      const hasBet1 = data.bet1?.house && data.bet1?.odd;
      const hasBet2 = data.bet2?.house && data.bet2?.odd;
      
      if (hasBet1 && hasBet2) {
        console.log('\n  [SUCCESS] All essential data extracted');
        successCount++;
      } else {
        console.log('\n  [PARTIAL] Missing some data');
        if (!hasBet1) console.log('    - Missing bet 1 data');
        if (!hasBet2) console.log('    - Missing bet 2 data');
        failCount++;
      }
    } catch (error: any) {
      console.log(`[ERROR] ${error.message}`);
      failCount++;
    }

    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  console.log('\n================================================================================');
  console.log('SUMMARY');
  console.log('================================================================================');
  console.log(`Total PDFs: ${successCount + failCount}`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed/Partial: ${failCount}`);
  console.log(`Success Rate: ${((successCount / (successCount + failCount)) * 100).toFixed(1)}%`);
  console.log('================================================================================');
}

testOCR().catch(console.error);
