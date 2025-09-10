import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vknxbpcnpdhziiqknrbs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbnhicGNucGRoemlpcWtucmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MjkyMTAsImV4cCI6MjA3MzAwNTIxMH0.oupKVcJplxy-H88HjeS4-QAaD8ChjyfcaqZDnC-xuIs';
const BUCKET_NAME = 'firmas';

@Injectable({ providedIn: 'root' })
export class SupabaseSignatureService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  /**
   * Sube una firma PNG al bucket y retorna la URL pública
   * @param file Blob o File (PNG)
   * @param userId string o number para identificar el archivo
   * @returns URL pública de la firma
   */
  async uploadSignature(file: Blob, userId: string | number): Promise<string> {
    const fileName = `firma_${userId}_${Date.now()}.png`;
    const { data, error } = await this.supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/png',
      });
    if (error) throw error;
    // Obtener URL pública
    const { publicUrl } = this.supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName).data;
    return publicUrl;
  }

  /**
   * Elimina una firma del bucket
   */
  async deleteSignature(fileUrl: string): Promise<void> {
    // Extraer el path relativo del archivo
    const path = fileUrl.split(`/${BUCKET_NAME}/`)[1];
    if (!path) throw new Error('No se pudo extraer el path del archivo');
    const { error } = await this.supabase.storage.from(BUCKET_NAME).remove([path]);
    if (error) throw error;
  }
}
