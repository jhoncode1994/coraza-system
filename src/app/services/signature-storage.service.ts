import { Injectable } from '@angular/core';
import { supabase } from '../config/supabase.config';
import { base64ToBlob } from '../utils/base64-to-blob';

@Injectable({
  providedIn: 'root'
})
export class SignatureStorageService {

  constructor() { }

  /**
   * Sube una firma en base64 a Supabase Storage
   * @param signatureBase64 La firma en formato base64
   * @param fileName Nombre del archivo (opcional, se genera automáticamente)
   * @returns Promise con la URL pública de la firma subida
   */
  async uploadSignature(signatureBase64: string, fileName?: string): Promise<string> {
    try {
      // 1. Convertir base64 a Blob
      const blob = base64ToBlob(signatureBase64, 'image/png');
      
      // 2. Generar nombre único si no se proporciona
      const finalFileName = fileName || `signature_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.png`;
      
      console.log('Subiendo firma a Supabase Storage:', finalFileName);
      
      // 3. Subir archivo a Supabase Storage
      const { data, error } = await supabase.storage
        .from('signatures')
        .upload(finalFileName, blob, {
          contentType: 'image/png',
          upsert: false
        });

      if (error) {
        console.error('Error subiendo firma:', error);
        throw new Error(`Error subiendo firma: ${error.message}`);
      }

      console.log('Firma subida exitosamente:', data);

      // 4. Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('signatures')
        .getPublicUrl(finalFileName);

      if (!urlData.publicUrl) {
        throw new Error('No se pudo obtener la URL pública de la firma');
      }

      console.log('URL pública obtenida:', urlData.publicUrl);
      return urlData.publicUrl;

    } catch (error) {
      console.error('Error en uploadSignature:', error);
      throw error;
    }
  }

  /**
   * Elimina una firma de Supabase Storage
   * @param fileName Nombre del archivo a eliminar
   * @returns Promise<boolean> true si se eliminó correctamente
   */
  async deleteSignature(fileName: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from('signatures')
        .remove([fileName]);

      if (error) {
        console.error('Error eliminando firma:', error);
        return false;
      }

      console.log('Firma eliminada exitosamente:', fileName);
      return true;
    } catch (error) {
      console.error('Error en deleteSignature:', error);
      return false;
    }
  }

  /**
   * Lista todas las firmas en el bucket
   * @returns Promise con la lista de archivos
   */
  async listSignatures() {
    try {
      const { data, error } = await supabase.storage
        .from('signatures')
        .list();

      if (error) {
        console.error('Error listando firmas:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en listSignatures:', error);
      throw error;
    }
  }
}
