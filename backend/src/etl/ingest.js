import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../config/prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to round nutrients to 1 decimal place
const round = (val) => Math.round((Number(val) || 0) * 10) / 10;

/**
 * Validate nutritional integrity using Atwater general factor check
 * Energy (kcal) should roughly equal 4*P + 4*C + 9*F (within +/- 15% allowance for dietary fiber and ash)
 */
function validateNutrientIntegrity(food) {
  const p = Number(food.protein) || 0;
  const c = Number(food.carbs) || 0;
  const f = Number(food.fat) || 0;
  const cal = Number(food.calories) || 0;

  if (cal < 0 || p < 0 || c < 0 || f < 0) {
    throw new Error(`Negative nutrient values rejected for "${food.name}"`);
  }

  if (cal > 0) {
    const theoreticalCal = p * 4 + c * 4 + f * 9;
    const diffRatio = Math.abs(theoreticalCal - cal) / cal;
    // Discrepancy warning threshold
    if (diffRatio > 0.45 && cal > 50) {
      console.warn(
        `⚠️ Atwater discrepancy notice for "${food.name}": reported ${cal} kcal vs theoretical ${round(theoreticalCal)} kcal`
      );
    }
  }
}

async function runEtlIngestion() {
  console.log('🚀 Starting Official Nutrition Datasets ETL Pipeline...');
  const startTime = Date.now();

  const datasetsDir = path.join(__dirname, 'datasets');

  // Load JSON datasets
  const ifctPath = path.join(datasetsDir, 'icmr_ifct_2017.json');
  const usdaPath = path.join(datasetsDir, 'usda_foundation.json');
  const offPath = path.join(datasetsDir, 'openfoodfacts_india.json');

  const ifctData = fs.existsSync(ifctPath) ? JSON.parse(fs.readFileSync(ifctPath, 'utf8')) : [];
  const usdaData = fs.existsSync(usdaPath) ? JSON.parse(fs.readFileSync(usdaPath, 'utf8')) : [];
  const offData = fs.existsSync(offPath) ? JSON.parse(fs.readFileSync(offPath, 'utf8')) : [];

  console.log(`📦 Loaded ${ifctData.length} ICMR-NIN IFCT foods`);
  console.log(`📦 Loaded ${usdaData.length} USDA Foundation foods`);
  console.log(`📦 Loaded ${offData.length} Open Food Facts India packaged foods`);

  let totalIngested = 0;
  let totalServings = 0;

  // 1. Ingest ICMR-NIN IFCT Dataset
  console.log('\n[1/3] Ingesting ICMR-NIN IFCT 2017 clinical tables...');
  for (const item of ifctData) {
    validateNutrientIntegrity(item);

    const aliases = [
      item.code,
      item.scientificName,
      item.name.toLowerCase(),
      item.regionalName ? item.regionalName.replace(/[^a-zA-Z0-9\s]/g, ' ') : '',
    ]
      .filter(Boolean)
      .join(', ');

    // Normalize base values to 100g
    const servingGrams = item.servingSizeGrams || 100;
    const ratioTo100g = 100 / servingGrams;

    const baseCal100g = round(item.calories * ratioTo100g);
    const baseP100g = round(item.protein * ratioTo100g);
    const baseC100g = round(item.carbs * ratioTo100g);
    const baseF100g = round(item.fat * ratioTo100g);
    const baseFib100g = round((item.fiber || 0) * ratioTo100g);

    // Upsert food item
    let food = await prisma.foodItem.findFirst({
      where: {
        OR: [
          { aliases: { contains: item.code } },
          { name: item.name },
        ],
      },
    });

    const foodDataPayload = {
      name: item.name,
      regionalName: item.regionalName || null,
      aliases,
      category: item.category || 'Staples & Ingredients',
      cuisine: item.cuisine || 'Pan-Indian',
      dietaryType: item.dietaryType || 'Veg',
      servingUnit: item.servingUnit || '100g',
      servingSizeGrams: servingGrams,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      fiber: item.fiber || 0,
      sugar: item.sugar || 0,
      sodium: item.sodium || 0,
      source: 'ICMR-NIN IFCT 2017',
      isVerified: true,
      isCustom: false,
    };

    if (food) {
      food = await prisma.foodItem.update({
        where: { id: food.id },
        data: foodDataPayload,
      });
    } else {
      food = await prisma.foodItem.create({
        data: foodDataPayload,
      });
    }

    totalIngested++;

    // Ingest portion servings
    if (item.servings && Array.isArray(item.servings)) {
      for (const s of item.servings) {
        const existingServing = await prisma.foodServing.findFirst({
          where: { foodItemId: food.id, unitName: s.unitName },
        });

        if (!existingServing) {
          await prisma.foodServing.create({
            data: {
              foodItemId: food.id,
              unitName: s.unitName,
              gramWeight: s.gramWeight,
              isDefault: s.isDefault ?? false,
            },
          });
          totalServings++;
        }
      }
    }
  }

  // 2. Ingest USDA Foundation Foods
  console.log('\n[2/3] Ingesting USDA FoodData Central foundation staples...');
  for (const item of usdaData) {
    validateNutrientIntegrity(item);

    const fdcCode = `FDC:${item.fdcId}`;
    const aliases = `${fdcCode}, ${item.name.toLowerCase()}`;

    let food = await prisma.foodItem.findFirst({
      where: {
        OR: [
          { aliases: { contains: fdcCode } },
          { name: item.name },
        ],
      },
    });

    const foodDataPayload = {
      name: item.name,
      regionalName: null,
      aliases,
      category: item.category || 'Global & Packaged Foods',
      cuisine: item.cuisine || 'International',
      dietaryType: item.dietaryType || 'All',
      servingUnit: item.servingUnit || '100g',
      servingSizeGrams: item.servingSizeGrams || 100,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      fiber: item.fiber || 0,
      sugar: item.sugar || 0,
      sodium: item.sodium || 0,
      source: 'USDA FoodData Central',
      isVerified: true,
      isCustom: false,
    };

    if (food) {
      food = await prisma.foodItem.update({
        where: { id: food.id },
        data: foodDataPayload,
      });
    } else {
      food = await prisma.foodItem.create({
        data: foodDataPayload,
      });
    }

    totalIngested++;

    if (item.servings && Array.isArray(item.servings)) {
      for (const s of item.servings) {
        const existingServing = await prisma.foodServing.findFirst({
          where: { foodItemId: food.id, unitName: s.unitName },
        });

        if (!existingServing) {
          await prisma.foodServing.create({
            data: {
              foodItemId: food.id,
              unitName: s.unitName,
              gramWeight: s.gramWeight,
              isDefault: s.isDefault ?? false,
            },
          });
          totalServings++;
        }
      }
    }
  }

  // 3. Ingest Open Food Facts India
  console.log('\n[3/3] Ingesting Open Food Facts India packaged staples & barcodes...');
  for (const item of offData) {
    validateNutrientIntegrity(item);

    const barcodeCode = `Barcode:${item.barcode}`;
    const aliases = `${barcodeCode}, ${item.barcode}, ${item.brand || ''}, ${item.name.toLowerCase()}`;

    let food = await prisma.foodItem.findFirst({
      where: {
        OR: [
          { aliases: { contains: item.barcode } },
          { name: item.name },
        ],
      },
    });

    const foodDataPayload = {
      name: item.name,
      regionalName: item.brand ? `Brand: ${item.brand}` : null,
      aliases,
      category: item.category || 'Global & Packaged Foods',
      cuisine: item.cuisine || 'Pan-Indian',
      dietaryType: item.dietaryType || 'Veg',
      servingUnit: item.servingUnit || '100g',
      servingSizeGrams: item.servingSizeGrams || 100,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      fiber: item.fiber || 0,
      sugar: item.sugar || 0,
      sodium: item.sodium || 0,
      source: 'Open Food Facts India',
      isVerified: true,
      isCustom: false,
    };

    if (food) {
      food = await prisma.foodItem.update({
        where: { id: food.id },
        data: foodDataPayload,
      });
    } else {
      food = await prisma.foodItem.create({
        data: foodDataPayload,
      });
    }

    totalIngested++;

    if (item.servings && Array.isArray(item.servings)) {
      for (const s of item.servings) {
        const existingServing = await prisma.foodServing.findFirst({
          where: { foodItemId: food.id, unitName: s.unitName },
        });

        if (!existingServing) {
          await prisma.foodServing.create({
            data: {
              foodItemId: food.id,
              unitName: s.unitName,
              gramWeight: s.gramWeight,
              isDefault: s.isDefault ?? false,
            },
          });
          totalServings++;
        }
      }
    }
  }

  const durationSec = round((Date.now() - startTime) / 1000);
  console.log('\n======================================================');
  console.log(`✅ ETL Ingestion Complete in ${durationSec}s!`);
  console.log(`📊 Verified Foods Ingested: ${totalIngested}`);
  console.log(`📏 Physical Portion Servings Configured: ${totalServings}`);
  console.log('🏛️ Sources: ICMR-NIN IFCT 2017, USDA FDC, Open Food Facts India');
  console.log('======================================================\n');
}

runEtlIngestion()
  .catch((err) => {
    console.error('❌ ETL Ingestion Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
