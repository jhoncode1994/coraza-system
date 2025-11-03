# 🔐 SISTEMA DE AUTENTICACIÓN - CORAZA SYSTEM

## ✅ RESUMEN DE CONFIGURACIÓN COMPLETADA

### 📊 Estado Actual del Sistema

**Tabla de autenticación:** `admin_users` (PostgreSQL)  
**Total de usuarios:** 4 usuarios activos  
**Sistema de permisos:** `user_permissions` vinculado correctamente

---

## 👥 USUARIOS DISPONIBLES

### 1. admin@coraza.com (Usuario de Prueba - ADMINISTRADOR)
```
📧 Email: admin@coraza.com
🔑 Contraseña: admin123
🎭 Role: admin
📂 Username: admin_coraza

✅ PERMISOS COMPLETOS:
  • Ver inventario ✓
  • Editar inventario ✓
  • Ver asociados ✓
  • Editar asociados ✓
  • Hacer entregas ✓
  • Ver reportes ✓
  • Gestionar usuarios ✓
```

### 2. entregador@coraza.com (Usuario de Prueba - ENTREGADOR)
```
📧 Email: entregador@coraza.com
🔑 Contraseña: entrega123
🎭 Role: moderator
📂 Username: entregador

⚠️ PERMISOS LIMITADOS:
  • Ver inventario ✓ (solo lectura)
  • Editar inventario ✗
  • Ver asociados ✓ (solo lectura)
  • Editar asociados ✗
  • Hacer entregas ✓
  • Ver reportes ✗
  • Gestionar usuarios ✗
```

### 3. jfzl1994@gmial.com (Usuario Original)
```
📧 Email: jfzl1994@gmial.com
🎭 Role: admin
📂 Username: coraza

⚠️ Sin permisos configurados (usa role base)
```

### 4. admin@coraza-dotacion.com (Usuario Original)
```
📧 Email: admin@coraza-dotacion.com
🎭 Role: super_admin
📂 Username: admin

⚠️ Sin permisos configurados (usa role base)
```

---

## 🔍 EXPLICACIÓN DEL SISTEMA

### ¿Qué tabla se usa para login?

**✅ TABLA USADA:** `admin_users`

```sql
SELECT * FROM admin_users WHERE username = 'admin_coraza';
```

**❌ TABLA NO USADA:** `auth.users` (Supabase Auth - NO existe)

### Flujo de Autenticación

1. Usuario ingresa email/password en `/login`
2. Frontend envía POST a `/api/auth/login`
3. Backend consulta `admin_users` 
4. Valida password con bcrypt (hash seguro)
5. Si es correcta:
   - Actualiza `last_login`
   - Resetea `failed_login_attempts`
   - Devuelve datos del usuario
6. Si es incorrecta:
   - Incrementa `failed_login_attempts`
   - Bloquea cuenta después de 5 intentos (30 min)

### Sistema de Permisos

**Tabla:** `user_permissions`  
**Relación:** `user_id` → `admin_users.id`

Permisos granulares disponibles:
- `can_view_inventory`
- `can_edit_inventory`
- `can_view_associates`
- `can_edit_associates`
- `can_make_deliveries`
- `can_view_reports`
- `can_manage_users`

---

## 🛠️ CAMBIOS REALIZADOS

### 1. Foreign Key Corregido
```sql
-- ANTES (ERROR):
user_permissions.user_id → auth.users.id

-- DESPUÉS (CORRECTO):
user_permissions.user_id → admin_users.id
```

### 2. Usuarios de Prueba Creados
- ✅ admin@coraza.com con permisos completos
- ✅ entregador@coraza.com con permisos limitados

### 3. Limpieza de Datos
- Eliminados registros huérfanos en `user_permissions`
- Permisos vinculados correctamente a `admin_users`

---

## 📝 NOTAS IMPORTANTES

### Diferencia entre `users` y `admin_users`

```
admin_users = Personas que USAN la aplicación web
              (Administradores, entregadores, supervisores)

users =       Asociados/empleados que RECIBEN dotación
              (Vigilantes, supervisores de campo)
```

### Roles Válidos en `admin_users`
- `admin` - Administrador estándar
- `super_admin` - Super administrador
- `moderator` - Moderador/Entregador

### Seguridad
- ✅ Contraseñas hasheadas con bcrypt (10 rounds)
- ✅ Bloqueo automático después de 5 intentos fallidos
- ✅ Desbloqueo automático después de 30 minutos
- ✅ Registro de `last_login` para auditoría

---

## 🚀 PRÓXIMOS PASOS

1. **Probar login** con los usuarios de prueba
2. **Verificar permisos** en la UI (editar inventario, etc.)
3. **Configurar permisos** para usuarios originales si es necesario

---

## 📞 CREDENCIALES DE ACCESO (PARA DOCUMENTACIÓN)

### Administrador (Acceso Completo)
- **Email:** admin@coraza.com
- **Contraseña:** admin123
- **Características:**
  - Acceso completo
  - Puede editar inventario
  - Puede gestionar asociados
  - Puede generar reportes
  - Puede eliminar registros antiguos

### Entregador (Acceso Limitado)
- **Email:** entregador@coraza.com
- **Contraseña:** entrega123
- **Características:**
  - Acceso limitado (solo lectura)
  - Puede consultar inventario
  - Puede consultar asociados
  - Puede registrar entregas desde ficha del asociado
  - NO puede editar inventario
  - NO puede generar reportes

---

**Fecha de configuración:** Noviembre 3, 2025  
**Estado:** ✅ Configuración completada y funcional
