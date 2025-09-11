import { Injectable } from '@angular/core';
import { supabase } from '../config/supabase.config';

// visualizacion de firmas-prueba: comentario agregado para forzar commit

@Injectable({
  providedIn: 'root'
})
export class SupabaseTestService {

  constructor() { }

  /**
   * Prueba la conexión con Supabase
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('Probando conexión con Supabase...');
      
      // Intentar listar buckets para probar la conexión
      const { data, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('Error conectando con Supabase:', error);
        return false;
      }
      
      console.log('Conexión exitosa! Buckets disponibles:', data);
      return true;
    } catch (error) {
      console.error('Error en testConnection:', error);
      return false;
    }
  }

  /**
   * Verifica si existe el bucket 'signatures'
   */
  async checkSignaturesBucket(): Promise<boolean> {
    try {
      // Método alternativo: intentar listar archivos del bucket
      console.log('Verificando bucket signatures con método alternativo...');
      const { data, error } = await supabase.storage
        .from('signatures')
        .list('', { limit: 1 });
      
      if (error) {
        console.error('Error accediendo al bucket signatures:', error);
        if (error.message.includes('Bucket not found')) {
          console.warn('⚠️ El bucket "signatures" no existe.');
          return false;
        }
        // Si el error no es "bucket not found", podría ser permisos
        console.warn('⚠️ Posible problema de permisos en el bucket signatures');
        return false;
      }
      
      console.log('✅ Bucket signatures accesible! Archivos encontrados:', data?.length || 0);
      return true;
    } catch (error) {
      console.error('Error en checkSignaturesBucket:', error);
      return false;
    }
  }

  /**
   * Prueba completa de funcionalidad
   */
  async runFullTest(): Promise<void> {
    console.log('🔧 Iniciando pruebas de Supabase Storage...');
    
    const connectionOk = await this.testConnection();
    if (!connectionOk) {
      console.error('❌ Error de conexión con Supabase');
      return;
    }
    
    const bucketExists = await this.checkSignaturesBucket();
    if (!bucketExists) {
      console.error('❌ El bucket "signatures" no existe o no es accesible');
      console.log('📝 Instrucciones para crear el bucket:');
      console.log('1. Ve a https://supabase.com/dashboard');
      console.log('2. Selecciona tu proyecto');
      console.log('3. Ve a Storage → Buckets');
      console.log('4. Crea un nuevo bucket llamado "signatures"');
      console.log('5. Marca "Public bucket" para permitir URLs públicas');
      console.log('6. Ve a la pestaña "Policies" del bucket');
      console.log('7. Asegúrate de que hay políticas que permitan SELECT e INSERT');
      return;
    }
    
    // Prueba de subida de archivo
    await this.testFileUpload();
    
    console.log('✅ Todas las pruebas pasaron exitosamente!');
    console.log('🎉 Supabase Storage está listo para usar');
  }

  /**
   * Prueba de subida de archivo
   */
  async testFileUpload(): Promise<void> {
    try {
      console.log('🔄 Probando subida de archivo de prueba...');
      
      // Crear un archivo de prueba pequeño
      const testData = new Blob(['test signature'], { type: 'text/plain' });
      const fileName = `test-${Date.now()}.txt`;
      
      const { data, error } = await supabase.storage
        .from('signatures')
        .upload(fileName, testData);
      
      if (error) {
        console.error('❌ Error subiendo archivo de prueba:', error);
        return;
      }
      
      console.log('✅ Archivo de prueba subido exitosamente!', data);
      
      // Intentar eliminar el archivo de prueba
      const { error: deleteError } = await supabase.storage
        .from('signatures')
        .remove([fileName]);
      
      if (deleteError) {
        console.warn('⚠️ No se pudo eliminar el archivo de prueba:', deleteError);
      } else {
        console.log('🗑️ Archivo de prueba eliminado correctamente');
      }
      
    } catch (error) {
      console.error('Error en testFileUpload:', error);
    }
  }
}
