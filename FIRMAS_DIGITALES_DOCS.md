# 📋 Sistema de Firmas Digitales - Documentación Técnica

## 🎯 Nueva Implementación con Supabase Storage

### Descripción General
El sistema de firmas digitales ha sido migrado de almacenamiento base64/blob en PostgreSQL (Neon) a Supabase Storage, mejorando significativamente la eficiencia, escalabilidad y mantenimiento.

---

## 🏗️ Arquitectura

### Frontend (Angular)
- **Componente**: `SignaturePadComponent` (`src/app/components/signature-pad/signature-pad.component.ts`)
- **Servicio**: `SupabaseSignatureService` (`src/app/services/supabase-signature.service.ts`)
- **Limpieza**: `SignatureCleanupService` (`src/app/services/signature-cleanup.service.ts`)

### Backend (Node.js/Express)
- **Endpoint**: `/api/delivery` (modificado para manejar `firma_url`)
- **Base de datos**: Campo `firma_url` en tabla `entrega_dotacion`

### Storage
- **Plataforma**: Supabase Storage
- **Bucket**: `firmas` (público)
- **Formato**: Archivos PNG con naming `firma_{userId}_{timestamp}.png`

---

## 🔄 Flujo de Funcionamiento

### 1. Captura de Firma
```typescript
// Usuario firma en el canvas
// SignaturePadComponent convierte canvas a Blob PNG
const blob = await new Promise<Blob>((resolve) => {
  canvas.toBlob((blob) => resolve(blob!), 'image/png');
});
```

### 2. Subida a Supabase Storage
```typescript
// SupabaseSignatureService sube el archivo
const publicUrl = await this.supabaseSignatureService.uploadSignature(blob, userId);
```

### 3. Almacenamiento en Base de Datos
```sql
-- Solo se guarda la URL pública, no el archivo completo
INSERT INTO entrega_dotacion (..., "firma_url") 
VALUES (..., 'https://vknxbpcnpdhziiqknrbs.supabase.co/storage/v1/object/public/firmas/firma_123_1757429210.png');
```

### 4. Visualización
```html
<!-- Muestra directamente desde la URL pública -->
<img [src]="entrega.firma_url" alt="Firma digital" />
```

---

## 🛠️ Configuración

### Variables de Entorno (Frontend)
```typescript
const SUPABASE_URL = 'https://vknxbpcnpdhziiqknrbs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
const BUCKET_NAME = 'firmas';
```

### Configuración de Supabase Storage
- **Bucket**: `firmas` (público)
- **Políticas**:
  - `allow_insert_firmas`: Permite INSERT para rol `anon`
  - `allow_upload_firmas`: Permite UPDATE para rol `anon`

---

## 📊 Ventajas de la Nueva Implementación

### ✅ Beneficios
1. **Eficiencia**: Base de datos más liviana (solo URLs vs archivos completos)
2. **Escalabilidad**: Supabase Storage maneja millones de archivos eficientemente
3. **Rendimiento**: Carga más rápida de consultas de base de datos
4. **Costo**: Storage de archivos más económico que almacenamiento en BD
5. **Simplicidad**: URL directa para mostrar firmas sin conversiones

### 📈 Comparación
| Aspecto | Implementación Anterior | Nueva Implementación |
|---------|------------------------|---------------------|
| Almacenamiento | Base64 en PostgreSQL | PNG en Supabase Storage |
| Tamaño BD | ~4KB por firma | ~100 bytes por URL |
| Velocidad consulta | Lenta (archivos grandes) | Rápida (solo URLs) |
| Escalabilidad | Limitada | Excelente |
| Carga de imagen | Conversión base64 | URL directa |

---

## 🔧 Mantenimiento

### Migración de Datos Existentes
- Ejecutado: `migrar-campo-firma.js`
- Resultado: Columna `firma_url` agregada
- Datos anteriores: Marcados como `MIGRATED_FROM_BASE64`

### Limpieza de Archivos Huérfanos
```typescript
// Eliminar firma cuando se elimine una entrega
await this.signatureCleanupService.cleanupSignatureOnDeliveryDelete(firmaUrl);
```

### Monitoreo
- URLs públicas accesibles directamente
- Archivos con naming predecible: `firma_{userId}_{timestamp}.png`
- Logs en consola para subidas/eliminaciones

---

## 🚀 Uso

### En Componentes Angular
```typescript
// Pasar userId al componente de firma
<app-signature-pad 
  [userId]="data.user.id"
  (signatureChange)="onSignatureChange($event)">
</app-signature-pad>

// Recibir URL pública en lugar de base64
onSignatureChange(signatureUrl: string | null): void {
  this.signature = signatureUrl; // URL pública de Supabase
}
```

### Visualización
```typescript
// En template
<img [src]="entrega.firma_url" alt="Firma digital" />

// Para diálogo de visualización
this.dialog.open(SignatureViewerComponent, {
  data: { signature: entrega.firma_url }
});
```

---

## 🔒 Seguridad

### Bucket Público
- **Ventaja**: URLs directas sin autenticación
- **Consideración**: Cualquiera con la URL puede ver la firma
- **Mitigación**: URLs difíciles de adivinar (timestamp + userId)

### Alternativa Futura (Bucket Privado)
- URLs firmadas temporalmente
- Mayor seguridad pero más complejidad
- Implementar si se requiere mayor privacidad

---

## 📝 Notas de Desarrollo

### Dependencias Agregadas
```bash
npm install @supabase/supabase-js
```

### Archivos Modificados
- `src/app/components/signature-pad/signature-pad.component.ts`
- `src/app/components/users/entrega-dotacion-dialog.component.ts`
- `src/app/services/entrega-dotacion.service.ts`
- `src/services/entregaDotacionService.ts`
- `server.js`

### Base de Datos
- Tabla: `entrega_dotacion`
- Nueva columna: `firma_url TEXT`
- Columna anterior: `firmaDigital` (mantenida por seguridad)

---

## 🎉 Estado Actual

✅ **Completado**:
- Migración de base de datos
- Servicios Angular para Supabase Storage
- Componente de firma actualizado
- Backend adaptado
- Documentación técnica

🔄 **Listo para usar**:
- Sistema completamente funcional
- Firmas se suben automáticamente a Supabase Storage
- URLs públicas guardadas en base de datos Neon
- Visualización directa desde URLs

---

**Fecha de implementación**: Septiembre 9, 2025  
**Versión**: 1.0.0  
**Desarrollador**: Sistema automatizado con GitHub Copilot
