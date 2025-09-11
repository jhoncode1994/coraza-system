import { Injectable } from '@angular/core';
import { supabase } from '../config/supabase.config';

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
      const { data, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('Error verificando buckets:', error);
        return false;
      }
      
      const signaturesBucket = data?.find((bucket: any) => bucket.name === 'signatures');
      const exists = !!signaturesBucket;
      
      console.log('Bucket signatures existe:', exists);
      if (exists) {
        console.log('Detalles del bucket signatures:', signaturesBucket);
      } else {
        console.warn('⚠️ El bucket "signatures" no existe. Debes crearlo en el dashboard de Supabase.');
      }
      
      return exists;
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
      console.error('❌ El bucket "signatures" no existe');
      console.log('📝 Instrucciones para crear el bucket:');
      console.log('1. Ve a https://supabase.com/dashboard');
      console.log('2. Selecciona tu proyecto');
      console.log('3. Ve a Storage → Buckets');
      console.log('4. Crea un nuevo bucket llamado "signatures"');
      console.log('5. Marca "Public bucket" para permitir URLs públicas');
      return;
    }
    
    console.log('✅ Todas las pruebas pasaron exitosamente!');
    console.log('🎉 Supabase Storage está listo para usar');
  }
}
