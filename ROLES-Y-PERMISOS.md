# Sistema de Roles y Permisos - Coraza System

## Descripción

Se ha implementado un sistema de roles y permisos que permite controlar el acceso a diferentes funcionalidades del sistema según el tipo de usuario.

## Roles Disponibles

### 1. Administrador (admin)
- **Usuario**: admin@coraza.com
- **Contraseña**: admin123
- **Permisos completos**:
  - ✅ Ver inventario
  - ✅ Editar inventario
  - ✅ Ver asociados
  - ✅ Editar asociados
  - ✅ Realizar entregas
  - ✅ Ver reportes
  - ✅ Gestionar usuarios

### 2. Usuario de Entregas (delivery_user)
- **Usuario**: entregador@coraza.com
- **Contraseña**: entrega123
- **Permisos limitados**:
  - ✅ Ver inventario
  - ❌ Editar inventario
  - ✅ Ver asociados
  - ❌ Editar asociados
  - ✅ Realizar entregas
  - ❌ Ver reportes
  - ❌ Gestionar usuarios

## Funcionalidades del Sistema

### AuthService

El servicio de autenticación (`auth.service.ts`) incluye los siguientes métodos:

```typescript
// Verificar permisos específicos
hasPermission(permission: keyof UserPermissions): boolean

// Verificar roles
isAdmin(): boolean
isDeliveryUser(): boolean

// Verificar permisos específicos (métodos de conveniencia)
canMakeDeliveries(): boolean
canEditInventory(): boolean
canManageUsers(): boolean

// Obtener permisos del usuario actual
getUserPermissions(): UserPermissions | null
```

### Uso en Componentes

```typescript
import { AuthService } from '../services/auth.service';

constructor(private authService: AuthService) {}

// Verificar si puede editar inventario
canEdit = this.authService.canEditInventory();

// Verificar si es administrador
isAdmin = this.authService.isAdmin();

// Verificar permiso específico
canViewReports = this.authService.hasPermission('canViewReports');
```

### Uso en Templates

```html
<!-- Mostrar botón solo si tiene permisos -->
<button *ngIf="authService.canEditInventory()" 
        mat-raised-button color="primary">
  Editar Inventario
</button>

<!-- Mostrar sección solo para administradores -->
<div *ngIf="authService.isAdmin()">
  <h3>Panel de Administración</h3>
  <!-- Contenido solo para admins -->
</div>

<!-- Mostrar diferente contenido según el rol -->
<ng-container *ngIf="authService.isDeliveryUser()">
  <h3>Panel de Entregas</h3>
  <!-- Contenido solo para usuarios de entrega -->
</ng-container>
```

## Sistema de Fallback

El sistema está configurado para intentar autenticación con el backend primero. Si el backend no está disponible, utiliza los usuarios locales definidos en `mockUsers` como fallback.

## Estructura de Permisos

```typescript
interface UserPermissions {
  canViewInventory: boolean;
  canEditInventory: boolean;
  canViewAssociates: boolean;
  canEditAssociates: boolean;
  canMakeDeliveries: boolean;
  canViewReports: boolean;
  canManageUsers: boolean;
}
```

## Próximos Pasos

1. **Implementar en UI**: Usar los métodos de verificación de permisos en los componentes existentes
2. **Guards de Ruta**: Crear guards para proteger rutas según permisos
3. **Interceptors**: Implementar interceptors para manejar autorización en las peticiones HTTP
4. **Gestión de Usuarios**: Crear interfaz para que los administradores puedan gestionar usuarios y roles

## Cómo Probar

1. Inicia la aplicación con `ng serve`
2. Navega al login
3. Prueba con las credenciales de administrador:
   - Email: admin@coraza.com
   - Contraseña: admin123
4. Prueba con las credenciales de entregador:
   - Email: entregador@coraza.com
   - Contraseña: entrega123
5. Verifica que los permisos se aplican correctamente en la interfaz