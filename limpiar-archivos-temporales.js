const fs = require('fs');
const path = require('path');

// Archivos específicos que sabemos que están vacíos o son temporales
const archivosTemporales = [
  'eliminar_duplicados.js',
  'test-db-connection.js',
  'test-db-operations.js',
  'simple-server.js',
  'simple-api.js',
  'verificar-tablas-tallas.js', // Ya cumplió su propósito después de la limpieza
  'debug-pantalones.js', // Script de debug temporal
  'test-user-simple.js',
  'start-with-env.js',
  'server-test.js',
  'manual-server.js',
  'insert-test-user.js',
  'insert-sample-sizes.js', // Ya no necesario después de revertir tallas
  'fix_inventory_capitalization.js',
  'fix_existing_user.js',
  'fix-users-table.js',
  'find-history-tables.js',
  'final_table_analysis.js',
  'expand-inventory.js',
  'create-movements-table.js',
  'create-entrega-dotacion-table.js',
  'convert-image-to-base64.js',
  'consultas_test.js',
  'cleanup_duplicate_tables.js',
  'check_columns.js',
  'check-supply-inventory-table.js',
  'check-database-schema.js',
  'check-associations.js',
  'backup-supply-inventory.js',
  'analizar_estructura_bd.js',
  'addSupplies.js',
  'add-sizes-to-supplies.js',
  'add-sample-data-with-sizes.js',
  'verificar_usuarios.js',
  'update_user_cargo.js',
  'update-supply-inventory.js',
  'test_user_creation.js',
  'sync-pantalones-stock.js',
  'run-database-script.js',
  'revertir-base-datos.js', // Ya cumplió su propósito
  'migrate-database.js',
  'insertar_usuarios_masivo.js',
  'init-database.js'
];

// Directorios que podrían contener archivos temporales
const directoriosARevisar = [
  'scripts',
  'src/services/dist' // Archivos compilados que no deberían estar en el repo
];

async function limpiarArchivosInnecesarios() {
  console.log('🧹 Iniciando limpieza de archivos innecesarios...\n');
  
  let archivosEliminados = [];
  let errores = [];

  // 1. Eliminar archivos específicos
  console.log('1. Eliminando archivos temporales específicos...');
  for (const archivo of archivosTemporales) {
    const rutaCompleta = path.join(__dirname, archivo);
    
    try {
      if (fs.existsSync(rutaCompleta)) {
        // Verificar si el archivo está vacío o contiene solo comentarios
        const contenido = fs.readFileSync(rutaCompleta, 'utf8').trim();
        const esArchivoVacio = contenido.length === 0;
        const soloComentarios = contenido.split('\n').every(linea => 
          linea.trim() === '' || linea.trim().startsWith('//') || linea.trim().startsWith('/*')
        );
        
        if (esArchivoVacio || soloComentarios || archivosTemporales.includes(archivo)) {
          fs.unlinkSync(rutaCompleta);
          archivosEliminados.push(archivo);
          console.log(`   ✅ ${archivo}`);
        }
      }
    } catch (error) {
      errores.push(`Error eliminando ${archivo}: ${error.message}`);
      console.log(`   ❌ Error: ${archivo} - ${error.message}`);
    }
  }

  // 2. Revisar directorio scripts
  console.log('\n2. Revisando directorio scripts/...');
  const scriptsPath = path.join(__dirname, 'scripts');
  if (fs.existsSync(scriptsPath)) {
    const archivosScripts = fs.readdirSync(scriptsPath);
    for (const archivo of archivosScripts) {
      if (archivo.endsWith('.js')) {
        const rutaCompleta = path.join(scriptsPath, archivo);
        try {
          const contenido = fs.readFileSync(rutaCompleta, 'utf8').trim();
          
          // Eliminar si contiene patrones temporales o de testing
          if (contenido.includes('test') || contenido.includes('debug') || 
              contenido.includes('temp') || contenido.length === 0) {
            fs.unlinkSync(rutaCompleta);
            archivosEliminados.push(`scripts/${archivo}`);
            console.log(`   ✅ scripts/${archivo}`);
          }
        } catch (error) {
          errores.push(`Error revisando scripts/${archivo}: ${error.message}`);
        }
      }
    }
  }

  // 3. Eliminar directorio dist si existe (archivos compilados)
  console.log('\n3. Revisando archivos compilados...');
  const distPath = path.join(__dirname, 'src', 'services', 'dist');
  if (fs.existsSync(distPath)) {
    try {
      fs.rmSync(distPath, { recursive: true, force: true });
      archivosEliminados.push('src/services/dist/ (directorio completo)');
      console.log('   ✅ src/services/dist/ (archivos compilados eliminados)');
    } catch (error) {
      errores.push(`Error eliminando directorio dist: ${error.message}`);
    }
  }

  // 4. Buscar archivos JavaScript vacíos adicionales
  console.log('\n4. Buscando archivos JavaScript vacíos adicionales...');
  const buscarArchivosVacios = (dir) => {
    const archivos = fs.readdirSync(dir);
    
    for (const archivo of archivos) {
      const rutaCompleta = path.join(dir, archivo);
      const stat = fs.statSync(rutaCompleta);
      
      if (stat.isDirectory() && !archivo.includes('node_modules') && archivo !== '.git') {
        buscarArchivosVacios(rutaCompleta);
      } else if (archivo.endsWith('.js') && !archivo.includes('node_modules')) {
        try {
          const contenido = fs.readFileSync(rutaCompleta, 'utf8').trim();
          if (contenido.length === 0) {
            const rutaRelativa = path.relative(__dirname, rutaCompleta);
            fs.unlinkSync(rutaCompleta);
            archivosEliminados.push(rutaRelativa);
            console.log(`   ✅ ${rutaRelativa} (archivo vacío)`);
          }
        } catch (error) {
          // Ignorar errores de lectura
        }
      }
    }
  };

  buscarArchivosVacios(__dirname);

  // Resumen
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMEN DE LIMPIEZA');
  console.log('='.repeat(50));
  
  if (archivosEliminados.length > 0) {
    console.log(`✅ Archivos eliminados (${archivosEliminados.length}):`);
    archivosEliminados.forEach(archivo => {
      console.log(`   - ${archivo}`);
    });
  } else {
    console.log('ℹ️  No se encontraron archivos para eliminar');
  }

  if (errores.length > 0) {
    console.log(`\n❌ Errores encontrados (${errores.length}):`);
    errores.forEach(error => {
      console.log(`   - ${error}`);
    });
  }

  console.log('\n🎉 Limpieza completada!');
  console.log('💡 El proyecto ahora está más limpio y organizado');
}

limpiarArchivosInnecesarios().catch(console.error);
