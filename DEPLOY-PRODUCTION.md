# 🚀 Configuración para Producción - Sistema Coraza

## 📋 **Pasos para Deployar en Línea**

### 1. **Instalar Dependencias Nuevas**

```bash
cd d:\documentos\FrontEnd\coraza-system
npm install bcrypt@^5.1.1 jsonwebtoken@^9.0.2
npm install --save-dev @types/bcrypt@^5.0.2 @types/jsonwebtoken@^9.0.5
```

### 2. **Configurar Base de Datos (Neon)**

#### A. Ejecutar SQL de configuración:
1. Conectar a tu base de datos Neon
2. Ejecutar el script: `database/setup-auth-users.sql`

#### B. Generar contraseñas hasheadas:
```bash
node setup-auth-passwords.js
```

#### C. Ejecutar los comandos SQL que genera el script anterior

### 3. **Variables de Entorno**

Agregar a tu `.env` (o variables de entorno de Render):

```env
# JWT Secret (cambiar por uno único en producción)
JWT_SECRET=tu-secreto-jwt-super-seguro-unico-para-produccion-12345

# Database URL (ya la tienes)
DATABASE_URL=tu-connection-string-de-neon

# Node Environment
NODE_ENV=production
```

### 4. **Actualizar Frontend para usar Backend Real**

El frontend ya está configurado para intentar backend primero y usar fallback local si falla.

### 5. **Compilar y Verificar**

```bash
# Compilar frontend
npm run build

# Compilar backend
npm run backend:build

# Verificar que no hay errores
ng build --configuration production
```

## 🔑 **Credenciales del Sistema**

### 👨‍💼 **Administrador**
- **Email**: `admin@coraza.com`
- **Contraseña**: `admin123`
- **Rol**: `admin`
- **Permisos**: Todos

### 🚛 **Usuario Entregador**
- **Email**: `entregador@coraza.com`
- **Contraseña**: `entrega123`
- **Rol**: `delivery_user`
- **Permisos**: Solo entregas

## 🏗️ **Arquitectura de Autenticación**

1. **Frontend** intenta login con backend
2. Si **backend falla**, usa usuarios locales (fallback)
3. **Backend** autentica contra PostgreSQL con JWT
4. **Permisos** se validan en tiempo real
5. **Sesiones** persisten en localStorage + JWT

## 📦 **Archivos Nuevos Creados**

- `database/setup-auth-users.sql` - Script de base de datos
- `src/services/authService.ts` - Servicio de auth backend
- `setup-auth-passwords.js` - Generador de hashes
- Endpoints agregados en `server.ts`:
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `POST /api/auth/users`

## 🧪 **Testing en Producción**

1. Deploy a Render
2. Configurar variables de entorno
3. Ejecutar scripts de BD
4. Probar login con ambos usuarios
5. Verificar permisos funcionan correctamente

## ✅ **Ready for Production**

El sistema ya está configurado para:
- ✅ Autenticación real con BD
- ✅ Fallback para desarrollo local
- ✅ Permisos granulares
- ✅ JWT tokens seguros
- ✅ Contraseñas hasheadas
- ✅ Separación admin/entregador

¡Listo para deployar! 🎉