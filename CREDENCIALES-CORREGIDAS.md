# 🔑 Credenciales Corregidas - Sistema Coraza

## ✅ **Credenciales Actualizadas**

### 👨‍💼 **Administrador** (Acceso completo)
- **Email**: `admin@coraza.com`
- **Contraseña**: `admin123`

### 🚛 **Usuario de Entregas** (Solo entregas)
- **Email**: `entregador@coraza.com`
- **Contraseña**: `entrega123`

## 🔧 **Cambios Realizados**

1. **Formulario de Login actualizado**: Ahora usa campo "Email" en lugar de "Usuario"
2. **Autenticación mejorada**: Se agregaron logs de depuración para verificar el proceso
3. **Validación corregida**: El sistema ahora valida correctamente el email

## 🧪 **Cómo Probar**

1. **Refresca la página** en http://localhost:4320/
2. **Usa las credenciales exactas**:
   - Para admin: `admin@coraza.com` / `admin123`
   - Para entregador: `entregador@coraza.com` / `entrega123`
3. **Verifica los permisos**: El usuario entregador solo verá botones limitados

## 🔍 **Logs de Depuración**

Ahora puedes abrir la **Consola del Navegador** (F12) para ver los logs de autenticación que te ayudarán a entender el proceso.

## ⚠️ **Importante**

- El campo ahora es **Email**, no usuario
- Las credenciales son **case-sensitive** (sensibles a mayúsculas/minúsculas)
- El sistema primero intenta conectar con el backend, luego usa usuarios locales

¡Ahora debería funcionar correctamente! 🎉