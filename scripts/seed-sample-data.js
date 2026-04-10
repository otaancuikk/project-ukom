const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function seedSampleData() {
  console.log('🌱 Seeding Sample Data...\n');
  
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'routertrack_db',
  };

  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ Connected to database\n');

    // Sample ONT data
    console.log('📦 Inserting sample ONT data...');
    const sampleONTs = [
      {
        serial_number: 'ZTEG12345001',
        item_code: 'ONT-F609',
        item_description: 'ZTE F609 GPON ONT',
        owner: 'PT Telkom Indonesia',
        purchase_reference: 'PO-2024-001',
        supplier: 'ZTE Corporation',
        location_type: 'Warehouse',
        location_code: 'WH-JKT-01',
        location_description: 'Jakarta Warehouse 1',
        inventory_status: 'In Stock',
        condition_status: 'Good',
        created_by: 'system'
      },
      {
        serial_number: 'ZTEG12345002',
        item_code: 'ONT-F670',
        item_description: 'ZTE F670 WiFi ONT',
        owner: 'PT Telkom Indonesia',
        purchase_reference: 'PO-2024-002',
        supplier: 'ZTE Corporation',
        location_type: 'Warehouse',
        location_code: 'WH-JKT-01',
        location_description: 'Jakarta Warehouse 1',
        inventory_status: 'In Stock',
        condition_status: 'Good',
        created_by: 'system'
      },
      {
        serial_number: 'HWTC12345001',
        item_code: 'ONT-HG8245',
        item_description: 'Huawei HG8245H5 GPON ONT',
        owner: 'PT Telkom Indonesia',
        purchase_reference: 'PO-2024-003',
        supplier: 'Huawei Technologies',
        location_type: 'Warehouse',
        location_code: 'WH-BDG-01',
        location_description: 'Bandung Warehouse 1',
        inventory_status: 'In Stock',
        condition_status: 'Good',
        created_by: 'system'
      }
    ];

    for (const ont of sampleONTs) {
      try {
        await connection.execute(
          `INSERT INTO ont_data (
            serial_number, item_code, item_description, owner,
            purchase_reference, supplier, location_type, location_code,
            location_description, inventory_status, condition_status, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            ont.serial_number, ont.item_code, ont.item_description, ont.owner,
            ont.purchase_reference, ont.supplier, ont.location_type, ont.location_code,
            ont.location_description, ont.inventory_status, ont.condition_status, ont.created_by
          ]
        );
        console.log(`   ✅ Added: ${ont.serial_number} - ${ont.item_description}`);
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`   ⏭️  Skipped: ${ont.serial_number} (already exists)`);
        } else {
          console.error(`   ❌ Error: ${ont.serial_number} - ${err.message}`);
        }
      }
    }

    // Count results
    console.log('\n📊 Database Statistics:');
    const [userCount] = await connection.execute('SELECT COUNT(*) as total FROM users');
    const [ontCount] = await connection.execute('SELECT COUNT(*) as total FROM ont_data');
    const [unrefurbishCount] = await connection.execute('SELECT COUNT(*) as total FROM unrefurbish_data');

    console.log(`   Users: ${userCount[0].total}`);
    console.log(`   ONT Data: ${ontCount[0].total}`);
    console.log(`   Unrefurbish Data: ${unrefurbishCount[0].total}`);

    await connection.end();

    console.log('\n═══════════════════════════════════════');
    console.log('✅ Sample data seeding complete!');
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure MySQL is running in Laragon\n');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 Run database/schema-mysql.sql first\n');
    }
  }
}

seedSampleData();
