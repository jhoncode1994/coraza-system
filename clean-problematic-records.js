const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function cleanProblematicRecords() {
  try {
    const client = await pool.connect();
    
    console.log('=== INICIANDO LIMPIEZA DE REGISTROS PROBLEMÁTICOS ===');
    
    // Obtener todos los registros problemáticos
    const problematicResult = await client.query(`
      SELECT id, code, name, category, talla, quantity 
      FROM supply_inventory 
      WHERE code LIKE '%-%-%' 
      ORDER BY code
    `);
    
    console.log(`Registros problemáticos encontrados: ${problematicResult.rows.length}`);
    
    // Iniciar transacción
    await client.query('BEGIN');
    
    for (const record of problematicResult.rows) {
      console.log(`\nProcesando: ID ${record.id}, Código: "${record.code}", Talla: "${record.talla}"`);
      
      // Extraer código base
      const baseCode = record.code.split('-')[0];
      const newCode = `${baseCode}-${record.talla}`;
      
      // Verificar si ya existe un registro con el código correcto
      const existingCheck = await client.query(
        'SELECT id FROM supply_inventory WHERE code = $1 AND id != $2',
        [newCode, record.id]
      );
      
      if (existingCheck.rows.length > 0) {
        console.log(`  -> Ya existe un registro con código "${newCode}". Eliminando duplicado...`);
        
        // Si existe, sumar las cantidades si es necesario
        if (record.quantity > 0) {
          await client.query(
            'UPDATE supply_inventory SET quantity = quantity + $1 WHERE code = $2',
            [record.quantity, newCode]
          );
          console.log(`  -> Cantidad ${record.quantity} sumada al registro existente`);
        }
        
        // Eliminar el registro problemático
        await client.query('DELETE FROM supply_inventory WHERE id = $1', [record.id]);
        console.log(`  -> Registro problemático eliminado`);
      } else {
        console.log(`  -> Actualizando código de "${record.code}" a "${newCode}"`);
        
        // Actualizar el código del registro
        await client.query(
          'UPDATE supply_inventory SET code = $1 WHERE id = $2',
          [newCode, record.id]
        );
        console.log(`  -> Código actualizado exitosamente`);
      }
    }
    
    // Confirmar cambios
    await client.query('COMMIT');
    console.log('\n=== LIMPIEZA COMPLETADA EXITOSAMENTE ===');
    
    // Verificar el estado final
    const finalCheck = await client.query(`
      SELECT id, code, name, category, talla, quantity 
      FROM supply_inventory 
      WHERE name = 'Pantalón' AND talla IS NOT NULL
      ORDER BY code
    `);
    
    console.log('\n=== ESTADO FINAL DE PANTALONES CON TALLA ===');
    finalCheck.rows.forEach(row => {
      console.log(`ID: ${row.id}, Código: "${row.code}", Talla: "${row.talla}", Stock: ${row.quantity}`);
    });
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('Error durante la limpieza:', error);
    
    // Rollback en caso de error
    try {
      const client = await pool.connect();
      await client.query('ROLLBACK');
      client.release();
    } catch (rollbackError) {
      console.error('Error en rollback:', rollbackError);
    }
  }
}

cleanProblematicRecords();