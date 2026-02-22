const prisma = require('../config/database');

async function generateCustomerLoginId() {

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

    const match = latestCustomer.loginId.match(/\d+$/);
    if (match) {
      nextNumber = parseInt(match[0]) + 1;
    }
  }


  const loginId = `C${String(nextNumber).padStart(4, '0')}`;

  const exists = await prisma.customerProfile.findUnique({
    where: { loginId },
  });

  if (exists) {

    return generateCustomerLoginId();
  }

  return loginId;
}

module.exports = {
  generateCustomerLoginId,
};
