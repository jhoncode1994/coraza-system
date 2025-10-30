# Script de Limpieza - Coraza System
# Mueve archivos temporales a carpeta _archive/

Write-Host "LIMPIANDO ARCHIVOS TEMPORALES" -ForegroundColor Cyan
Write-Host "=" * 60

# Crear carpeta de archivo
$archiveFolder = "_archive"
if (-not (Test-Path $archiveFolder)) {
    New-Item -ItemType Directory -Path $archiveFolder | Out-Null
    Write-Host "Carpeta _archive/ creada" -ForegroundColor Green
}

# Lista de archivos a mover
$filesToArchive = @(
    # Scripts de diagnóstico
    "agregar-genero-inventory.js",
    "analyze-size-management.js",
    "check-all-problematic.js",
    "check-database-tables.js",
    "check-db-records.js",
    "check-elements-with-sizes.js",
    "check-entrega-dotacion-table.js",
    "check-history-tables.js",
    "check-inventory-and-sizes.js",
    "check-inventory-movements.js",
    "check-inventory.js",
    "check-problematic-codes.js",
    "check-sizes-table.js",
    "check-sizes-tables.js",
    "check-structure.js",
    "check-table-structure.js",
    "check-tables.js",
    "check-users-table.js",
    "check_cargo_column.js",
    
    # Scripts de limpieza ya ejecutados
    "clean-database.js",
    "clean-problematic-records.js",
    "cleanup_duplicate_tables.js",
    "corregir-bota-34.js",
    "limpiar-archivos-temporales.js",
    "limpiar-columna-antigua.js",
    "limpiar-columnas-huerfanas.js",
    "limpiar-elemento-duplicado.js",
    
    # Scripts de migración ejecutados
    "aplicar-todas-modificaciones-bd.js",
    "tarea-1-agregar-camisa-18-mujer.js",
    "tarea-2-eliminar-camisa-6-mujer.js",
    "eliminar-overoles-tallas-pequenas.js",
    "migrar-campo-firma.js",
    "migrate-tallas.js",
    "ejecutar-agregar-genero.js",
    
    # Scripts de creación/expansión
    "crear-inventario-completo.js",
    "create-all-size-variants.js",
    "create-entrega-dotacion-table.js",
    "create-movements-table.js",
    "expand-inventory.js",
    
    # Scripts de debug
    "debug-pantalones-issue.js",
    "debug-pantalones.js",
    "debug-sizes.js",
    "diagnostico-tallas.js",
    
    # Scripts de testing
    "test-available-sizes.js",
    "test-complete-size-system.js",
    "test-database-direct.js",
    "test-db-connection.js",
    "test-db-connection.ts",
    "test-db-operations.js",
    "test-delivery-system.js",
    "test-delivery.js",
    "test-fixed-available-sizes.js",
    "test-fixed-delivery.js",
    "test-query-fix.js",
    "test-server.js",
    "test-signature-flow.js",
    "test-size-addition.js",
    "test-sizes-endpoint.js",
    "test-tallas-endpoint.js",
    "final-system-test.js",
    
    # Scripts de verificación
    "verificar-bota-34.js",
    "verificar-columnas-tallas.js",
    "verificar-elementos-sin-genero.js",
    "verificar-estado-final.js",
    "verificar-estructura-tabla.js",
    "verificar-inventario-produccion.js",
    "verificar-tablas-tallas.js",
    "verificar-tablas.js",
    
    # Scripts de investigación
    "investigate-inventory.js",
    "find-history-tables.js",
    "show-database-structure.js",
    
    # Scripts de actualización/fix
    "fix-database-problems.js",
    "fix-dotation-system.js",
    "fix-users-table.js",
    "fix_inventory_capitalization.js",
    "update-supply-inventory.js",
    "update_user_cargo.js",
    "sync-pantalones-stock.js",
    "revertir-base-datos.js",
    "universal-clean-codes.js",
    
    # Scripts de optimización
    "optimize-size-management.js",
    
    # Scripts de inserción
    "insert-sample-sizes.js",
    "insert-test-user.js",
    
    # Scripts de obtención
    "get-users.js",
    
    # Scripts de prueba de servidor
    "basic-server.js",
    "server-test.js",
    "run-database-script.js",
    "setup-auth-passwords.js",
    
    # Archivos SQL obsoletos
    "agregar-genero-tallas.sql",
    "create_users_table.sql",
    "database-tallas-pantalones.sql",
    "insert-sample-sizes.sql",
    "database-schema.sql",
    
    # Archivos HTML de prueba
    "api-test.html",
    
    # Archivos de documentación temporal (mantener solo los importantes)
    "CREDENCIALES-CORREGIDAS.md",
    "DB_CONFIG.md",
    "DEPLOY-PRODUCTION.md",
    "deploy-trigger.txt",
    "dotation-system-summary.md",
    "FIRMAS_DIGITALES_DOCS.md",
    "IMPLEMENTACION-GENERO-TALLAS.md",
    "INVENTARIO-PERMISOS-CORREGIDO.md",
    "login-compact-summary.md",
    "REPORTE-MIGRACION-FIRMAS.md",
    "ROLES-Y-PERMISOS.md",
    "SISTEMA-ENTREGAS-CON-TALLAS.md",
    "SISTEMA-ROLES-COMPLETADO.md",
    "SISTEMA-TALLAS-COMPLETO.md",
    "tallas-system-complete-guide.md",
    "VERIFICACION-SISTEMA-TALLAS.md"
)

$movedCount = 0
$notFoundCount = 0

foreach ($file in $filesToArchive) {
    if (Test-Path $file) {
        Move-Item -Path $file -Destination $archiveFolder -Force
        Write-Host "  Movido: $file" -ForegroundColor Gray
        $movedCount++
    } else {
        $notFoundCount++
    }
}

Write-Host "`n" + ("=" * 60)
Write-Host "RESUMEN:" -ForegroundColor Cyan
Write-Host "  Archivos movidos: $movedCount" -ForegroundColor Green
Write-Host "  No encontrados: $notFoundCount" -ForegroundColor Yellow
Write-Host "`nLIMPIEZA COMPLETADA" -ForegroundColor Green
Write-Host "`nLos archivos estan en _archive/ por si los necesitas despues" -ForegroundColor Yellow
