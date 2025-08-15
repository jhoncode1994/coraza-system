const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  username: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT || 5432,
  ssl: { rejectUnauthorized: false }
});

async function updateUsersTable() {
  try {
    const client = await pool.connect();
    
    console.log('🔄 Actualizando estructura de la tabla users...');
    
    // Eliminar tabla existente y crear nueva con estructura correcta
    await client.query('DROP TABLE IF EXISTS users CASCADE');
    
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        apellido VARCHAR(100) NOT NULL,
        cedula VARCHAR(20) UNIQUE NOT NULL,
        zona INTEGER NOT NULL,
        fecha_ingreso DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Tabla users creada con estructura correcta');
    
    // Insertar algunos usuarios de prueba
    console.log('👥 Insertando usuarios de prueba...');
    
    const testUsers = [
      { nombre: 'Juan', apellido: 'Pérez', cedula: '12345678', zona: 1, fecha_ingreso: '2023-01-15' },
      { nombre: 'María', apellido: 'González', cedula: '87654321', zona: 2, fecha_ingreso: '2023-02-20' },
      { nombre: 'Carlos', apellido: 'Rodríguez', cedula: '11223344', zona: 1, fecha_ingreso: '2023-03-10' }
    ];
    
    for (const user of testUsers) {
      await client.query(
        'INSERT INTO users (nombre, apellido, cedula, zona, fecha_ingreso) VALUES ($1, $2, $3, $4, $5)',
        [user.nombre, user.apellido, user.cedula, user.zona, user.fecha_ingreso]
      );
      console.log(`✅ Usuario insertado: ${user.nombre} ${user.apellido}`);
    }
    
    // Verificar la nueva estructura
    console.log('\n📋 Nueva estructura de la tabla:');
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    console.table(structure.rows);
    
    console.log('\n👥 Usuarios insertados:');
    const users = await client.query('SELECT * FROM users');
    console.table(users.rows);
    
    client.release();
    console.log('\n🎉 ¡Tabla users actualizada correctamente!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error al actualizar tabla users:', error);
    process.exit(1);
  }
}

updateUsersTable();
