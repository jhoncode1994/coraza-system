const fs = require('fs');

// Leer el archivo de inserción masiva
const contenido = fs.readFileSync('insertar_usuarios_masivo.js', 'utf-8');

// Extraer todas las líneas que contienen usuarios
const lineasUsuarios = contenido.split('\n').filter(linea => 
    linea.includes('cedula:') && linea.includes('nombre:')
);

console.log(`📊 Total de líneas de usuarios encontradas: ${lineasUsuarios.length}`);

// Extraer cédulas y crear un mapa para detectar duplicados
const cedulasMap = new Map();
const duplicados = [];

lineasUsuarios.forEach((linea, index) => {
    const match = linea.match(/cedula:\s*['"](\d+)['"]/);
    if (match) {
        const cedula = match[1];
        const numeroLinea = contenido.split('\n').findIndex(l => l === linea) + 1;
        
        if (cedulasMap.has(cedula)) {
            // Es un duplicado
            const primerOcurrencia = cedulasMap.get(cedula);
            duplicados.push({
                cedula,
                primerOcurrencia,
                duplicado: {
                    linea: numeroLinea,
                    contenido: linea.trim()
                }
            });
        } else {
            // Primera ocurrencia
            cedulasMap.set(cedula, {
                linea: numeroLinea,
                contenido: linea.trim()
            });
        }
    }
});

console.log(`\n🔍 ANÁLISIS DE DUPLICADOS:`);
console.log(`📈 Total de cédulas únicas: ${cedulasMap.size}`);
console.log(`🔄 Total de duplicados encontrados: ${duplicados.length}`);

if (duplicados.length > 0) {
    console.log(`\n⚠️  USUARIOS DUPLICADOS DETECTADOS:\n`);
    
    duplicados.forEach((dup, index) => {
        console.log(`${index + 1}. Cédula: ${dup.cedula}`);
        console.log(`   Primera ocurrencia (línea ${dup.primerOcurrencia.linea}): ${dup.primerOcurrencia.contenido}`);
        console.log(`   Duplicado (línea ${dup.duplicado.linea}): ${dup.duplicado.contenido}`);
        console.log('');
    });

    // Crear archivo de respaldo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `insertar_usuarios_masivo_backup_${timestamp}.js`;
    fs.writeFileSync(backupFile, contenido);
    console.log(`💾 Respaldo creado: ${backupFile}`);

    // Crear lista de líneas a eliminar (solo las duplicadas, manteniendo la primera ocurrencia)
    const lineasAEliminar = duplicados.map(dup => dup.duplicado.linea);
    
    console.log(`\n🗑️  Líneas que serán eliminadas: ${lineasAEliminar.join(', ')}`);
    
    // Crear nuevo contenido sin duplicados
    const lineasOriginales = contenido.split('\n');
    const lineasLimpias = lineasOriginales.filter((linea, index) => 
        !lineasAEliminar.includes(index + 1)
    );
    
    const contenidoLimpio = lineasLimpias.join('\n');
    
    // Escribir archivo limpio
    fs.writeFileSync('insertar_usuarios_masivo.js', contenidoLimpio);
    
    console.log(`\n✅ PROCESO COMPLETADO:`);
    console.log(`🗑️  ${duplicados.length} usuarios duplicados eliminados`);
    console.log(`📝 Archivo actualizado sin duplicados`);
    console.log(`💾 Respaldo guardado como: ${backupFile}`);
    
} else {
    console.log(`\n✅ ¡Excelente! No se encontraron usuarios duplicados.`);
}

// Estadísticas finales
console.log(`\n📊 ESTADÍSTICAS FINALES:`);
console.log(`📈 Total de usuarios únicos: ${cedulasMap.size}`);
console.log(`🔄 Duplicados eliminados: ${duplicados.length}`);
console.log(`📝 Usuarios finales en el archivo: ${cedulasMap.size}`);
