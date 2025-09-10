import { Injectable } from '@angular/core';


@Injectable({ providedIn: 'root' })
export class SignatureCleanupService {
  
  constructor() {}

  /**
   * Elimina una firma del storage cuando se elimine una entrega
   * @param firmaUrl URL de la firma a eliminar
   */
  async cleanupSignatureOnDeliveryDelete(firmaUrl: string): Promise<void> {
    if (!firmaUrl || firmaUrl === 'MIGRATED_FROM_BASE64') return;
    
    try {
  // Cleanup de firmas deshabilitado (Supabase eliminado)
    } catch (error) {
      console.warn('⚠️ Error eliminando firma del storage:', error);
      // No lanzar error para no bloquear la eliminación de la entrega
    }
  }

  /**
   * Método para limpiar firmas huérfanas (uso administrativo)
   * Este método puede ser llamado periódicamente para limpiar archivos huérfanos
   */
  async cleanupOrphanedSignatures(): Promise<{ cleaned: number; errors: number }> {
    console.log('🧹 Iniciando limpieza de firmas huérfanas...');
    // Implementar lógica para encontrar y eliminar firmas huérfanas
    // Por ahora, retornamos un placeholder
    return { cleaned: 0, errors: 0 };
  }
}
