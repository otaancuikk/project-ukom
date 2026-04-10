const bcrypt = require('bcryptjs');

// Script untuk generate password hash
async function generateHash() {
  const passwords = [
    { label: 'Admin Password', password: 'admin123456' },
    { label: 'User Demo Password', password: 'user123456' }
  ];

  console.log('🔐 Generating password hashes...\n');

  for (const item of passwords) {
    const hash = await bcrypt.hash(item.password, 10);
    console.log(`${item.label}:`);
    console.log(`  Plain: ${item.password}`);
    console.log(`  Hash:  ${hash}\n`);
  }
}

generateHash().catch(console.error);
