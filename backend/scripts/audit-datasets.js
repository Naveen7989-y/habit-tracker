import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const datasetsDir = path.join(__dirname, '..', 'src', 'etl', 'datasets');

const ifctPath = path.join(datasetsDir, 'icmr_ifct_2017.json');
const usdaPath = path.join(datasetsDir, 'usda_foundation.json');
const offPath = path.join(datasetsDir, 'openfoodfacts_india.json');

const ifct = JSON.parse(fs.readFileSync(ifctPath, 'utf8'));
const usda = JSON.parse(fs.readFileSync(usdaPath, 'utf8'));
const off = JSON.parse(fs.readFileSync(offPath, 'utf8'));

console.log('=== DATASET PROVENANCE AUDIT ===\n');

function auditDataset(name, items, idKey) {
  console.log(`--- ${name} (${items.length} records) ---`);
  let issues = 0;
  for (const item of items) {
    const id = item[idKey];
    const name = item.name;
    const p = item.protein || 0;
    const c = item.carbs || 0;
    const f = item.fat || 0;
    const cal = item.calories || 0;
    const sGrams = item.servingSizeGrams;
    const sUnit = item.servingUnit;
    const state = item.state || 'unspecified';

    // Check Atwater
    const theoCal = p * 4 + c * 4 + f * 9;
    const diff = cal > 0 ? Math.abs(theoCal - cal) / cal : 0;
    const hasAtwaterWarning = diff > 0.15 && cal > 50;

    // Check servings
    const servingsCount = Array.isArray(item.servings) ? item.servings.length : 0;
    const hasDefault = item.servings?.some(s => s.isDefault);

    if (hasAtwaterWarning) {
      console.warn(`⚠️ [Atwater Discrepancy > 15%] ${id} "${name}": reported ${cal} kcal vs theoretical ${theoCal.toFixed(1)} kcal (diff: ${(diff*100).toFixed(1)}%) | P:${p} C:${c} F:${f}`);
    }

    if (item.servingSizeGrams !== 100) {
      console.log(`ℹ️ [Non-100g base] ${id} "${name}": base is ${item.servingSizeGrams}g (${item.servingUnit})`);
    }

    if (servingsCount === 0 || !hasDefault) {
      console.warn(`⚠️ [Serving Warning] ${id} "${name}": ${servingsCount} servings, hasDefault: ${hasDefault}`);
    }
  }
  console.log(`Summary for ${name}: ${issues} missing field issues found.\n`);
}

auditDataset('ICMR-NIN IFCT 2017', ifct, 'code');
auditDataset('USDA FoodData Central', usda, 'fdcId');
auditDataset('Open Food Facts India', off, 'barcode');
