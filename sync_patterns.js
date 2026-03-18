const { PrismaClient } = require('@prisma/client');
const patternService = require('./src/services/patternService');

const prisma = new PrismaClient();

async function sync() {
  const user = await prisma.user.findUnique({ where: { email: 'agent_tester_01@symbiosis.ai' } });
  if (!user) {
    console.log('User not found');
    return;
  }
  
  console.log(`Analyzing patterns for user ${user.id}...`);
  
  try {
    const result = await patternService.analyzeNewEntry(user.id, null);
    console.log(`  Created ${result.newPatterns.length} new patterns.`);
  } catch (e) {
    console.error(`  Error analyzing patterns:`, e.stack);
  }
  
  console.log('Pattern sync complete.');
  process.exit();
}

sync();
