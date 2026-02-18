const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPricingTiers() {
    console.log('Checking pricing tiers...\n');

    const tiers = await prisma.pricingTier.findMany({
        orderBy: { id: 'asc' }
    });

    console.log('Available Pricing Tiers:');
    console.log('─'.repeat(60));
    tiers.forEach(tier => {
        console.log(`ID: ${tier.id}`);
        console.log(`Name: ${tier.name}`);
        console.log(`Base Price: £${tier.basePrice}`);
        console.log(`Description: ${tier.description}`);
        console.log('─'.repeat(60));
    });

    await prisma.$disconnect();
}

checkPricingTiers().catch(console.error);
