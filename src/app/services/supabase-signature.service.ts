import { Injectable } from '@angular/core';
import { supabase, SIGNATURES_BUCKET } from '../config/supabase.config';
import { base64ToBlob } from '../utils/base64-to-blob';

@Injectable({
  providedIn: 'root'
})
export class SupabaseSignatureService {

  constructor() { }

  /**
   * Sube una firma en base64 a Supabase Storage
   * @param signatureBase64 - La firma en formato base64
   * @param fileName - Nombre opcional del archivo (se genera automáticamente si no se proporciona)
   * @returns Promise con la URL pública de la firma subida
   */
  async uploadSignature(signatureBase64: string, fileName?: string): Promise<string> {
    try {
      // 1. Convertir base64 a Blob
      const blob = base64ToBlob(signatureBase64, 'image/png');
      
      // 2. Generar nombre único para el archivo
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const finalFileName = fileName || `signature_${timestamp}_${randomId}.png`;
      
      // 3. Subir el archivo a Supabase Storage
      const { data, error } = await supabase.storage
        .from(SIGNATURES_BUCKET)
        .upload(finalFileName, blob, {
          contentType: 'image/png',
          upsert: false
        });

      if (error) {
        console.error('Error subiendo firma a Supabase:', error);
        throw new Error(`Error subiendo firma: ${error.message}`);
      }

      // 4. Obtener la URL pública
      const { data: publicUrlData } = supabase.storage
        .from(SIGNATURES_BUCKET)
        .getPublicUrl(finalFileName);

      if (!publicUrlData?.publicUrl) {
        throw new Error('No se pudo obtener la URL pública de la firma');
      }

      console.log('Firma subida exitosamente:', publicUrlData.publicUrl);
      return publicUrlData.publicUrl;

    } catch (error) {
      console.error('Error en uploadSignature:', error);
      throw error;
    }
  }

  /**
   * Elimina una firma de Supabase Storage
   * @param signatureUrl - URL pública de la firma a eliminar
   */
  async deleteSignature(signatureUrl: string): Promise<void> {
    try {
      // Extraer el nombre del archivo de la URL
      const fileName = signatureUrl.split('/').pop();
      if (!fileName) {
        throw new Error('No se pudo extraer el nombre del archivo de la URL');
      }

      const { error } = await supabase.storage
        .from(SIGNATURES_BUCKET)
        .remove([fileName]);

      if (error) {
        console.error('Error eliminando firma de Supabase:', error);
        throw new Error(`Error eliminando firma: ${error.message}`);
      }

      console.log('Firma eliminada exitosamente:', fileName);
    } catch (error) {
      console.error('Error en deleteSignature:', error);
      throw error;
    }
  }

  /**
   * Verifica si el bucket existe y está configurado correctamente
   */
  async checkBucketConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('Error conectando con Supabase Storage:', error);
        return false;
      }

      const bucketExists = data?.some(bucket => bucket.name === SIGNATURES_BUCKET);
      console.log(`Bucket '${SIGNATURES_BUCKET}' ${bucketExists ? 'existe' : 'no existe'}`);
      
      return bucketExists || false;
    } catch (error) {
      console.error('Error verificando bucket:', error);
      return false;
    }
  }
}
