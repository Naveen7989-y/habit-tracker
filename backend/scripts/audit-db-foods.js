import prisma from '../src/config/prisma.js';

async function auditFoods() {
  const total = await prisma.foodItem.count();
  const bySource = await prisma.foodItem.groupBy({
    by: ['source', 'isVerified'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  });
  const servingsCount = await prisma.foodServing.count();
  
  console.log('--- DATABASE FOOD AUDIT ---');
  console.log('Total FoodItem records in DB:', total);
  console.log('Total FoodServing records in DB:', servingsCount);
  console.log('\nBreakdown by Source & Verification Status:');
  console.table(bySource.map(s => ({
    Source: s.source,
    isVerified: s.isVerified,
    Count: s._count.id
  })));

  // Sample items from each source
  console.log('\nSample items per source:');
  for (const s of bySource) {
    const samples = await prisma.foodItem.findMany({
      where: { source: s.source, isVerified: s.isVerified },
      take: 3,
      select: { id: true, name: true, aliases: true, calories: true, protein: true, carbs: true, fat: true }
    });
    console.log(`\nSource: "${s.source}" (Verified: ${s.isVerified})`);
    console.table(samples);
  }

  // Check for any potential duplicates (by name)
  const duplicates = await prisma.$queryRaw`
    SELECT name, count(*) as count 
    FROM food_items 
    GROUP BY name 
    HAVING count(*) > 1;
  `;
  console.log('\nDuplicate FoodItem names:');
  console.table(duplicates);

  // Check how many have IFCT code in aliases
  const withIfctCode = await prisma.foodItem.count({
    where: { aliases: { contains: 'IFCT:' } }
  });
  console.log('\nFoods with explicit IFCT: code:', withIfctCode);

  // Check how many have USDA FDC code in aliases
  const withFdcCode = await prisma.foodItem.count({
    where: { aliases: { contains: 'FDC:' } }
  });
  console.log('Foods with explicit FDC: code:', withFdcCode);

  // Check how many have Barcode in aliases
  const withBarcode = await prisma.foodItem.count({
    where: { aliases: { contains: 'Barcode:' } }
  });
  console.log('Foods with explicit Barcode:', withBarcode);

  await prisma.$disconnect();
}

auditFoods().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
