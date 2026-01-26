const prisma = require('../config/database');

/**
 * Generate unique login ID for customer
 * Format: C + 4-digit sequential number (e.g., C0001, C0002)
 */
async function generateCustomerLoginId() {
  // Get the latest customer profile with a loginId
  const latestCustomer = await prisma.customerProfile.findFirst({
    where: {
      loginId: {
        not: null,
      },
    },
    orderBy: {
      id: 'desc',
    },
    select: {
      loginId: true,
    },
  });

  let nextNumber = 1;

  if (latestCustomer && latestCustomer.loginId) {
    // Extract number from loginId (e.g., "C0001" -> 1, "T022" -> 22)
    const match = latestCustomer.loginId.match(/\d+$/);
    if (match) {
      nextNumber = parseInt(match[0]) + 1;
    }
  }

  // Format with leading zeros (4 digits)
  const loginId = `C${String(nextNumber).padStart(4, '0')}`;

  // Check if it already exists (should not happen, but safety check)
  const exists = await prisma.customerProfile.findUnique({
    where: { loginId },
  });

  if (exists) {
    // If by chance it exists, try next number
    return generateCustomerLoginId();
  }

  return loginId;
}

module.exports = {
  generateCustomerLoginId,
};
