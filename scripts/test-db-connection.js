const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('🔍 Testing MySQL Database Connection...\n');
  
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'routertrack_db',
  };

  console.log('📋 Configuration:');
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   User: ${config.user}`);
  console.log(`   Database: ${config.database}`);
  console.log(`   Password: ${config.password ? '***' : '(empty)'}\n`);

  try {
    // Test connection
    console.log('⏳ Connecting to MySQL...');
    const connection = await mysql.createConnection(config);
    console.log('✅ Connection successful!\n');

    // Test database
    console.log('🔍 Checking database and tables...');
    const [tables] = await connection.execute(
      'SHOW TABLES'
    );
    
    if (tables.length === 0) {
      console.log('⚠️  Database exists but no tables found!');
      console.log('   Please run database/schema-mysql.sql\n');
      await connection.end();
      return;
    }

    console.log(`✅ Found ${tables.length} tables:`);
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`   - ${tableName}`);
    });
    console.log('');

    // Check users table
    console.log('👥 Checking users table...');
    const [users] = await connection.execute(
      'SELECT id, username, email, role, status FROM users'
    );
    
    if (users.length === 0) {
      console.log('⚠️  No users found in database!');
      console.log('   Please run database/schema-mysql.sql to insert admin user\n');
    } else {
      console.log(`✅ Found ${users.length} user(s):`);
      users.forEach(user => {
        console.log(`   - ${user.username} (${user.email}) - Role: ${user.role}, Status: ${user.status}`);
      });
      console.log('');
    }

    // Check ONT data
    console.log('📦 Checking ont_data table...');
    const [ontCount] = await connection.execute(
      'SELECT COUNT(*) as total FROM ont_data'
    );
    console.log(`   Total ONT records: ${ontCount[0].total}`);

    // Check unrefurbish data
    console.log('🔧 Checking unrefurbish_data table...');
    const [unrefurbishCount] = await connection.execute(
      'SELECT COUNT(*) as total FROM unrefurbish_data'
    );
    console.log(`   Total unrefurbish records: ${unrefurbishCount[0].total}\n`);

    await connection.end();

    console.log('═══════════════════════════════════════');
    console.log('✅ Database setup is complete!');
    console.log('═══════════════════════════════════════');
    console.log('\n🚀 Next steps:');
    console.log('   1. Run: npm run dev');
    console.log('   2. Open: http://localhost:3000');
    console.log('   3. Login with:');
    console.log('      - Email: admin@routertrack.com');
    console.log('      - Password: admin123456\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Solution:');
      console.log('   1. Open Laragon');
      console.log('   2. Click "Start All" to start MySQL');
      console.log('   3. Wait for MySQL to start (green light)');
      console.log('   4. Run this script again\n');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 Solution:');
      console.log('   1. Open phpMyAdmin (http://localhost/phpmyadmin)');
      console.log('   2. Click "SQL" tab');
      console.log('   3. Copy-paste content from database/schema-mysql.sql');
      console.log('   4. Click "Go" to execute');
      console.log('   5. Run this script again\n');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Solution:');
      console.log('   Check your .env.local file:');
      console.log('   - DB_USER should be "root"');
      console.log('   - DB_PASSWORD should be empty (no value) for Laragon\n');
    } else {
      console.log('\n💡 Check:');
      console.log('   - .env.local configuration');
      console.log('   - MySQL is running in Laragon');
      console.log('   - Database exists in phpMyAdmin\n');
    }
  }
}

testConnection();
