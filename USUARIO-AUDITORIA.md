# Usuario de Gerencia - Documentación

## 📋 Resumen

Se ha implementado un nuevo rol **"gerencia"** en el sistema Coraza para usuarios de gerencia que necesitan supervisar y auditar el sistema. Este usuario tiene permisos de **solo lectura** con acceso completo a reportes y movimientos.

## 🎯 Características del Rol Gerencia

### ✅ Permisos Habilitados
- **Ver inventario**: Puede consultar todo el inventario disponible
- **Ver asociados**: Puede ver la lista completa de asociados
- **Ver reportes**: Puede acceder y descargar todos los reportes en PDF
- **Ver movimientos**: Puede consultar todos los movimientos e historial

### ❌ Permisos Restringidos
- **NO puede editar inventario**: Solo visualización
- **NO puede editar asociados**: Solo visualización
- **NO puede realizar entregas**: No tiene acceso al módulo de entregas
- **NO puede gestionar usuarios**: No puede crear/modificar usuarios

## 🔧 Archivos Modificados

### 1. Frontend - Angular

#### `/src/app/interfaces/user-role.interface.ts`
- Se agregó el rol `'gerencia'` al tipo `role`
- Se agregaron permisos por defecto para el rol gerencia

#### `/src/app/services/auth.service.ts`
- Se actualizó la interfaz `User` para incluir el rol `'gerencia'`
- Se agregó un usuario de prueba `'gerencia'` en `mockUsers`

### 2. Backend - Node.js

#### `/src/services/authService.ts`
- Se actualizó la interfaz `AuthUser` para incluir el rol `'gerencia'`

## 📦 Archivos Creados

### 1. Script SQL
**Archivo**: `/database/create-auditor-user.sql`

Script SQL para crear directamente el usuario en la base de datos PostgreSQL.

### 2. Script Node.js
**Archivo**: `/scripts/create-auditor-user.js`

Script automatizado para crear el usuario de gerencia con todas las validaciones necesarias.

## 🚀 Cómo Implementar

### Opción 1: Usar el Script Node.js (Recomendado)

```bash
# Asegúrate de tener la variable DATABASE_URL configurada
node scripts/create-auditor-user.js
```

Este script:
- ✅ Genera automáticamente el hash de la contraseña
- ✅ Crea el usuario si no existe
- ✅ Actualiza el usuario si ya existe
- ✅ Configura los permisos correctamente
- ✅ Muestra un resumen completo de la configuración

### Opción 2: Ejecutar el Script SQL Directamente

```bash
# Conectarse a la base de datos y ejecutar el archivo
psql $DATABASE_URL -f database/create-auditor-user.sql
```

## 🔑 Credenciales por Defecto

Una vez creado el usuario, podrás acceder con:

```
Email: gerencia@coraza.com
Usuario: Usuario Gerencia
Contraseña: gerencia123
```

> ⚠️ **IMPORTANTE**: Cambia la contraseña por defecto en producción.

## 🔐 Cambiar la Contraseña

### Método 1: Generar nuevo hash con Node.js

```javascript
const bcrypt = require('bcrypt');
const password = 'tu-nueva-contraseña-segura';
bcrypt.hash(password, 10).then(hash => console.log(hash));
```

### Método 2: Ejecutar SQL

```sql
UPDATE auth_users 
SET password_hash = 'el-nuevo-hash-generado',
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'gerencia@coraza.com';
```

## 📊 Casos de Uso

### 1. Auditoría de Movimientos
El usuario de gerencia puede:
- Ver el historial completo de entregas
- Consultar movimientos de inventario
- Revisar asociados activos y retirados

### 2. Generación de Reportes
El usuario de gerencia puede:
- Descargar PDFs de entregas
- Generar reportes de inventario
- Exportar información para análisis

### 3. Supervisión sin Riesgo
El usuario de gerencia puede:
- Revisar todo el sistema sin riesgo de modificaciones accidentales
- Acceder a información sensible de forma segura
- Auditar operaciones realizadas por otros usuarios

## 🛡️ Seguridad

### Separación de Responsabilidades
- **Admin**: Control total del sistema
- **Delivery User**: Solo entregas y consultas básicas
- **Gerencia**: Supervisión completa sin permisos de modificación

### Ventajas del Rol Gerencia
1. **No puede modificar datos**: Garantiza integridad de la información
2. **Acceso completo a reportes**: Para análisis y toma de decisiones
3. **No puede crear entregas**: Evita conflictos operacionales
4. **No puede gestionar usuarios**: Mantiene la seguridad del sistema

## 📝 Notas Adicionales

### Crear Múltiples Usuarios de Gerencia

Si necesitas crear más usuarios con rol de gerencia:

1. Modifica el script SQL o Node.js con un nuevo email
2. Ejecuta el script nuevamente
3. O usa el módulo de gestión de usuarios (si tienes rol admin)

### Personalizar Permisos

Si necesitas ajustar los permisos de gerencia, edita:

```typescript
// En user-role.interface.ts
gerencia: {
  canViewInventory: true,    // Cambiar según necesidad
  canEditInventory: false,
  canViewAssociates: true,
  canEditAssociates: false,
  canMakeDeliveries: false,
  canViewReports: true,      // Este es crítico para auditoría
  canManageUsers: false,
}
```

## ✅ Verificación

Después de crear el usuario, verifica que:

1. ✅ Puedes iniciar sesión con las credenciales proporcionadas
2. ✅ El menú principal muestra solo las opciones de lectura y reportes
3. ✅ No aparecen botones de edición o creación
4. ✅ Puedes descargar PDFs y ver reportes
5. ✅ No puedes realizar entregas ni modificar datos

## 🆘 Solución de Problemas

### El usuario no puede iniciar sesión
- Verifica que `is_active = true` en la tabla `auth_users`
- Confirma que el hash de contraseña es correcto
- Revisa que la tabla `user_permissions` tiene registros para este usuario

### El usuario ve opciones de edición
- Verifica los permisos en la tabla `user_permissions`
- Confirma que el rol es exactamente `'gerencia'`
- Revisa el código frontend para validación de permisos

### No se generan los reportes
- Verifica que `can_view_reports = true`
- Confirma que el servicio de reportes valida el permiso correctamente
- Revisa los logs del backend para errores

## 📞 Soporte

Para más información o problemas:
- Revisa los logs del sistema
- Consulta la documentación de autenticación
- Contacta al administrador del sistema
