const fs = require('fs');
const path = require('path');
const translate = require('google-translate-api-x');

const LOCALES_DIR = path.join(__dirname, '../src/locales');
const EN_PATH = path.join(LOCALES_DIR, 'en.json');

const LANGS = [
  'hi', 'gu', 'kn', 'ur', 'bn', 'mr', 'ta', 'te', 'ml', 'or', 'pa', 
  'as', 'ne', 'sa', 'mai', 'sat', 'sd', 'gom', 'doi', 'mni-Mtei'
]; // Excluded 'brx' and 'ks' due to API limitations, we will handle them differently.

async function main() {
  const enData = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
  const keys = Object.keys(enData);
  const englishValues = Object.values(enData);

  console.log(`Loaded en.json with ${keys.length} keys.`);

  for (const lang of LANGS) {
    const langFilePath = path.join(LOCALES_DIR, `${lang === 'mni-Mtei' ? 'mni' : lang}.json`);
    let existingData = {};
    if (fs.existsSync(langFilePath)) {
      existingData = JSON.parse(fs.readFileSync(langFilePath, 'utf8'));
    }

    const newLangData = {};
    const keysToTranslate = [];
    const valuesToTranslate = [];

    // Find keys that are missing or still in English
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const enVal = englishValues[i];
      const existingVal = existingData[key];

      if (!existingVal || existingVal === enVal) {
        keysToTranslate.push(key);
        valuesToTranslate.push(enVal);
      } else {
        // Keep existing good translation
        newLangData[key] = existingVal;
      }
    }

    if (keysToTranslate.length === 0) {
      console.log(`[${lang}] Already fully translated!`);
      // Just rewrite to ensure key order matches en.json
      const sortedData = {};
      for (const k of keys) sortedData[k] = newLangData[k];
      fs.writeFileSync(langFilePath, JSON.stringify(sortedData, null, 2) + '\n');
      continue;
    }

    console.log(`[${lang}] Translating ${keysToTranslate.length} missing/unoptimized keys...`);
    
    // Batch translate in chunks of 50 to avoid rate limits
    const CHUNK_SIZE = 50;
    for (let i = 0; i < keysToTranslate.length; i += CHUNK_SIZE) {
      const chunkValues = valuesToTranslate.slice(i, i + CHUNK_SIZE);
      const chunkKeys = keysToTranslate.slice(i, i + CHUNK_SIZE);
      
      try {
        const res = await translate(chunkValues, { to: lang, forceBatch: false });
        // res can be an array if multiple inputs, or a single object if 1 input
        const resArray = Array.isArray(res) ? res : [res];
        
        for (let j = 0; j < chunkKeys.length; j++) {
          newLangData[chunkKeys[j]] = resArray[j].text;
        }
        
        // Wait 1 second between chunks to respect rate limit
        await new Promise(r => setTimeout(r, 1000));
      } catch (err) {
        console.error(`[${lang}] Failed to translate chunk starting at index ${i}:`, err.message);
        // Fallback to English on error
        for (let j = 0; j < chunkKeys.length; j++) {
          newLangData[chunkKeys[j]] = chunkValues[j];
        }
      }
    }

    // Ensure final JSON has the exact same key order as en.json
    const finalData = {};
    for (const key of keys) {
      finalData[key] = newLangData[key] || enData[key];
    }

    fs.writeFileSync(langFilePath, JSON.stringify(finalData, null, 2) + '\n');
    console.log(`[${lang}] Saved successfully.`);
  }
}

main().catch(console.error);
