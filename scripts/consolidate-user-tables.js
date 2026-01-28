// ============================================================
// SCRIPT DE CONSOLIDACIÓN DE TABLAS DE USUARIOS
// Migra todos los usuarios a admin_users (tabla principal)
// Ejecutar: node scripts/consolidate-user-tables.js
// Fecha: 28 de Enero 2026
// ============================================================

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function consolidateUserTables() {
  const client = await pool.connect();
  
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   🔄 CONSOLIDACIÓN DE TABLAS DE USUARIOS                       ║');
  console.log('║   Fecha: ' + new Date().toLocaleString('es-CO').padEnd(49) + '║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('\n');

  try {
    // ============================================================
    // PASO 1: ANALIZAR ESTADO ACTUAL
    // ============================================================
    console.log('┌────────────────────────────────────────────────────────────────┐');
    console.log('│ 1️⃣  ANALIZANDO ESTADO ACTUAL                                   │');
    console.log('└────────────────────────────────────────────────────────────────┘\n');

    // Verificar usuarios en auth_users
    const authUsers = await client.query(`
      SELECT id, username, email, role, is_active, password_hash
      FROM auth_users
      ORDER BY id
    `);
    console.log(`   📊 Usuarios en auth_users: ${authUsers.rows.length}`);
    authUsers.rows.forEach(u => {
      console.log(`      • ${u.username} (${u.email}) - ${u.role}`);
    });

    // Verificar usuarios en admin_users
    const adminUsers = await client.query(`
      SELECT id, username, email, role, is_active, password_hash
      FROM admin_users
      ORDER BY id
    `);
    console.log(`\n   📊 Usuarios en admin_users: ${adminUsers.rows.length}`);
    adminUsers.rows.forEach(u => {
      console.log(`      • ${u.username} (${u.email}) - ${u.role}`);
    });

    // Verificar tablas que referencian auth_users
    const fkToAuth = await client.query(`
      SELECT 
        tc.table_name, 
        kcu.column_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu 
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu 
        ON ccu.constraint_name = tc.constraint_name 
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND ccu.table_name = 'auth_users'
    `);
    console.log(`\n   🔗 Tablas con FK a auth_users: ${fkToAuth.rows.length}`);
    fkToAuth.rows.forEach(r => {
      console.log(`      • ${r.table_name}.${r.column_name}`);
    });

    // ============================================================
    // PASO 2: AGREGAR COLUMNAS FALTANTES A admin_users
    // ============================================================
    console.log('\n┌────────────────────────────────────────────────────────────────┐');
    console.log('│ 2️⃣  PREPARANDO TABLA admin_users                               │');
    console.log('└────────────────────────────────────────────────────────────────┘\n');

    // Agregar columna fecha_ingreso si no existe
    try {
      await client.query(`
        ALTER TABLE admin_users 
        ADD COLUMN IF NOT EXISTS fecha_ingreso TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `);
      console.log('   ✅ Columna fecha_ingreso agregada/verificada');
    } catch (e) {
      console.log('   ℹ️  Columna fecha_ingreso ya existe');
    }

    // ============================================================
    // PASO 3: MIGRAR USUARIOS DE auth_users A admin_users
    // ============================================================
    console.log('\n┌────────────────────────────────────────────────────────────────┐');
    console.log('│ 3️⃣  MIGRANDO USUARIOS                                          │');
    console.log('└────────────────────────────────────────────────────────────────┘\n');

    // Mapeo de roles
    const roleMapping = {
      'admin': 'admin',
      'delivery_user': 'moderator',
      'gerencia': 'admin',
      'super_admin': 'super_admin'
    };

    let migrated = 0;
    let skipped = 0;

    for (const user of authUsers.rows) {
      // Verificar si ya existe un usuario con ese email en admin_users
      const existing = await client.query(
        'SELECT id FROM admin_users WHERE email = $1',
        [user.email]
      );

      if (existing.rows.length > 0) {
        console.log(`   ⏭️  ${user.username} (${user.email}) - Ya existe en admin_users`);
        skipped++;
        continue;
      }

      // Mapear el rol
      const newRole = roleMapping[user.role] || 'moderator';

      // Insertar en admin_users
      try {
        await client.query(`
          INSERT INTO admin_users (username, email, password_hash, role, is_active, fecha_ingreso, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        `, [user.username, user.email, user.password_hash, newRole, user.is_active, new Date()]);

        console.log(`   ✅ ${user.username} (${user.email}) migrado como ${newRole}`);
        migrated++;
      } catch (e) {
        console.log(`   ❌ Error migrando ${user.username}: ${e.message}`);
      }
    }

    console.log(`\n   📊 Resumen: ${migrated} migrados, ${skipped} omitidos (ya existían)`);

    // ============================================================
    // PASO 4: MIGRAR PERMISOS DE user_permissions
    // ============================================================
    console.log('\n┌────────────────────────────────────────────────────────────────┐');
    console.log('│ 4️⃣  MIGRANDO PERMISOS                                          │');
    console.log('└────────────────────────────────────────────────────────────────┘\n');

    // Verificar si existe user_permissions
    const permissionsExist = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_permissions'
      ) as exists
    `);

    if (permissionsExist.rows[0].exists) {
      // Crear tabla admin_user_permissions si no existe
      await client.query(`
        CREATE TABLE IF NOT EXISTS admin_user_permissions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES admin_users(id) ON DELETE CASCADE,
          can_view_inventory BOOLEAN DEFAULT false,
          can_edit_inventory BOOLEAN DEFAULT false,
          can_view_associates BOOLEAN DEFAULT false,
          can_edit_associates BOOLEAN DEFAULT false,
          can_make_deliveries BOOLEAN DEFAULT false,
          can_view_reports BOOLEAN DEFAULT false,
          can_manage_users BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id)
        )
      `);
      console.log('   ✅ Tabla admin_user_permissions creada/verificada');

      // Migrar permisos existentes
      const permissions = await client.query(`
        SELECT up.*, au.email 
        FROM user_permissions up
        JOIN auth_users au ON up.user_id = au.id
      `);

      for (const perm of permissions.rows) {
        // Encontrar el usuario correspondiente en admin_users
        const adminUser = await client.query(
          'SELECT id FROM admin_users WHERE email = $1',
          [perm.email]
        );

        if (adminUser.rows.length > 0) {
          // Verificar si ya tiene permisos
          const existingPerm = await client.query(
            'SELECT id FROM admin_user_permissions WHERE user_id = $1',
            [adminUser.rows[0].id]
          );

          if (existingPerm.rows.length === 0) {
            await client.query(`
              INSERT INTO admin_user_permissions 
              (user_id, can_view_inventory, can_edit_inventory, can_view_associates, 
               can_edit_associates, can_make_deliveries, can_view_reports, can_manage_users)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
              adminUser.rows[0].id,
              perm.can_view_inventory,
              perm.can_edit_inventory,
              perm.can_view_associates,
              perm.can_edit_associates,
              perm.can_make_deliveries,
              perm.can_view_reports,
              perm.can_manage_users
            ]);
            console.log(`   ✅ Permisos migrados para ${perm.email}`);
          } else {
            console.log(`   ⏭️  Permisos ya existen para ${perm.email}`);
          }
        }
      }
    } else {
      console.log('   ℹ️  Tabla user_permissions no existe, omitiendo migración de permisos');
    }

    // ============================================================
    // PASO 5: VERIFICAR RESULTADO FINAL
    // ============================================================
    console.log('\n┌────────────────────────────────────────────────────────────────┐');
    console.log('│ 5️⃣  VERIFICANDO RESULTADO FINAL                                │');
    console.log('└────────────────────────────────────────────────────────────────┘\n');

    const finalUsers = await client.query(`
      SELECT id, username, email, role, is_active 
      FROM admin_users 
      ORDER BY id
    `);
    
    console.log('   📋 Usuarios en admin_users (tabla consolidada):');
    console.log('   ┌────┬──────────────────────┬───────────────────────────────┬─────────────┐');
    console.log('   │ ID │ Username             │ Email                         │ Role        │');
    console.log('   ├────┼──────────────────────┼───────────────────────────────┼─────────────┤');
    finalUsers.rows.forEach(u => {
      console.log(`   │ ${String(u.id).padEnd(2)} │ ${u.username.padEnd(20)} │ ${u.email.padEnd(29)} │ ${u.role.padEnd(11)} │`);
    });
    console.log('   └────┴──────────────────────┴───────────────────────────────┴─────────────┘');

    // ============================================================
    // RESUMEN
    // ============================================================
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║              ✅ CONSOLIDACIÓN COMPLETADA                        ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log('║  La tabla principal ahora es: admin_users                      ║');
    console.log('║  El servidor usa admin_users para autenticación                ║');
    console.log('║                                                                ║');
    console.log('║  ⚠️  PRÓXIMOS PASOS (manuales cuando esté listo):               ║');
    console.log('║  1. Verificar que el login funciona correctamente              ║');
    console.log('║  2. Si todo está OK, ejecutar cleanup para eliminar auth_users ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

// Verificar si se pasó --yes como argumento
const autoConfirm = process.argv.includes('--yes') || process.argv.includes('-y');

if (autoConfirm) {
  consolidateUserTables().then(() => process.exit(0));
} else {
  // Confirmación antes de ejecutar
  console.log('\n⚠️  ATENCIÓN: Este script consolidará las tablas de usuarios.');
  console.log('   Esto migrará datos de auth_users → admin_users.\n');

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('¿Deseas continuar? (s/n): ', (answer) => {
    if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'si') {
      consolidateUserTables().then(() => {
        rl.close();
        process.exit(0);
      });
    } else {
      console.log('\n❌ Operación cancelada.\n');
      rl.close();
      process.exit(0);
    }
  });
}
