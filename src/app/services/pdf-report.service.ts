import { Injectable } from '@angular/core';

export interface DeliveryRecord {
  fecha: string;
  elemento: string;
  talla?: string;  // Nueva propiedad para talla
  cantidad: number;
  observaciones?: string;
  asociado?: string;
  cedula?: string;
}

export interface ElementSummary {
  elemento: string;
  totalEntregado: number;
  entregas: DeliveryRecord[];
}

// Importar dinámicamente jsPDF
declare global {
  interface Window {
    jsPDF: any;
  }
}

@Injectable({
  providedIn: 'root'
})
export class PdfReportService {

  constructor() { }

  /**
   * Carga una imagen y la convierte a base64 para usar en PDF
   */
  private async loadImageAsBase64(imagePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx?.drawImage(img, 0, 0);
        
        try {
          const dataURL = canvas.toDataURL('image/png');
          resolve(dataURL);
        } catch (error) {
          console.warn('Error converting image to base64, using fallback');
          resolve(''); // Fallback: imagen vacía
        }
      };
      
      img.onerror = () => {
        console.warn('Error loading image, using fallback');
        resolve(''); // Fallback: imagen vacía
      };
      
      img.src = imagePath;
    });
  }

  /**
   * Añade encabezado al PDF con manejo de errores
   */
  private async addHeader(doc: any, title: string = ''): Promise<number> {
    try {
      // Intentar cargar la imagen del encabezado
      const headerBase64 = await this.loadImageAsBase64('assets/envabezado.png');
      
      if (headerBase64) {
        // Si la imagen se cargó correctamente, añadirla
        doc.addImage(headerBase64, 'PNG', 20, 10, 170, 30);
      }
      
      // Añadir título del documento debajo del encabezado
      if (title) {
        doc.setFontSize(16);
        doc.setTextColor(44, 62, 80);
        doc.text(title, 105, 55, { align: 'center' });
      }
      
      // Línea separadora
      doc.setLineWidth(0.5);
      doc.setTextColor(0, 0, 0);
      doc.line(20, 65, 190, 65);
      
      return 75; // Retorna la posición Y donde debe comenzar el contenido
    } catch (error) {
      console.warn('Error adding header:', error);
      // Fallback: solo título sin imagen
      if (title) {
        doc.setFontSize(16);
        doc.setTextColor(44, 62, 80);
        doc.text(title, 20, 20);
        doc.setLineWidth(0.5);
        doc.setTextColor(0, 0, 0);
        doc.line(20, 25, 190, 25);
        return 35;
      }
      return 20;
    }
  }

  /**
   * Verifica si las librerías de PDF están disponibles y las carga si es necesario
   */
  private async loadPdfLibraries(): Promise<any> {
    console.log('🔄 Iniciando carga de librerías PDF...');
    
    // Limpiar cualquier estado residual anterior
    this.cleanupPdfState();
    
    // Verificar si jsPDF ya está disponible globalmente
    if (typeof window !== 'undefined' && (window as any).jsPDF) {
      console.log('✅ jsPDF ya está disponible globalmente');
      // Siempre retornar la clase constructora, no una instancia
      return (window as any).jsPDF;
    }

    // Para producción, usar solo CDN que es más confiable
    return this.loadFromCDN();
  }

  /**
   * Limpia cualquier estado residual de generaciones anteriores de PDF
   */
  private cleanupPdfState(): void {
    try {
      // Limpiar eventos y listeners que puedan estar pendientes
      if (typeof window !== 'undefined') {
        // Forzar garbage collection de cualquier documento PDF anterior
        if ((window as any).jsPDF) {
          console.log('🧹 Limpiando estado PDF anterior...');
          // No eliminar jsPDF, solo limpiar posibles referencias colgantes
        }
      }
    } catch (error) {
      console.warn('⚠️ Error durante limpieza de estado PDF:', error);
    }
  }

  /**
   * Finaliza la generación de PDF y limpia recursos
   */
  private async finalizePdfGeneration(doc: any): Promise<void> {
    try {
      console.log('🔄 Finalizando generación de PDF...');
      
      // Limpiar referencias del documento
      if (doc) {
        // Intentar limpiar el documento sin romper la funcionalidad
        doc = null;
      }
      
      // Pequeña pausa para permitir que el navegador procese la descarga
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('✅ PDF finalizado correctamente');
    } catch (error) {
      console.warn('⚠️ Error durante finalización de PDF:', error);
    }
  }

  /**
   * Método para cargar desde CDN - optimizado para producción
   */
  private async loadFromCDN(): Promise<any> {
    console.log('📦 Iniciando carga desde CDN...');
    
    // Verificar si jsPDF ya está disponible globalmente
    if (typeof window !== 'undefined' && (window as any).jsPDF) {
      console.log('✅ jsPDF ya está disponible globalmente');
      return (window as any).jsPDF;
    }

    if (typeof window === 'undefined') {
      throw new Error('Window no está disponible (entorno no browser)');
    }

    try {
      console.log('🌐 Verificando conectividad de red...');
      
      // URLs de jsPDF con versiones más estables
      const jsPDFUrls = [
        'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
        'https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js',
        'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js'
      ];
      
      const autoTableUrls = [
        'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.6.0/jspdf.plugin.autotable.min.js',
        'https://unpkg.com/jspdf-autotable@3.6.0/dist/jspdf.plugin.autotable.min.js',
        'https://cdn.jsdelivr.net/npm/jspdf-autotable@3.6.0/dist/jspdf.plugin.autotable.min.js'
      ];
      
      // Intentar cargar jsPDF con múltiples CDNs
      let jsPDFLoaded = false;
      let lastError: any = null;
      
      for (let i = 0; i < jsPDFUrls.length; i++) {
        const url = jsPDFUrls[i];
        try {
          console.log(`📥 Intentando cargar jsPDF desde: ${url}`);
          await this.loadScript(url);
          
          // Esperar un poco para que se procese
          await new Promise(resolve => setTimeout(resolve, 800));
          
          // Verificar múltiples formas de acceso
          const jsPDFCheck = (window as any).jsPDF || 
                           (window as any).jspdf || 
                           ((window as any).window && (window as any).window.jsPDF);
          
          if (jsPDFCheck) {
            console.log(`✅ jsPDF cargado exitosamente desde: ${url}`);
            console.log('Tipo de jsPDF:', typeof jsPDFCheck);
            // Normalizar acceso - asegurar que esté disponible como jsPDF
            if (!(window as any).jsPDF && (window as any).jspdf) {
              (window as any).jsPDF = (window as any).jspdf;
              console.log('🔧 Normalizando acceso: jspdf -> jsPDF');
            }
            jsPDFLoaded = true;
            break;
          } else {
            console.warn(`⚠️ jsPDF no disponible después de cargar ${url}`);
            console.log('Propiedades window con "pdf":', Object.keys(window).filter(k => k.toLowerCase().includes('pdf')));
          }
        } catch (error) {
          lastError = error;
          console.error(`❌ Error cargando desde ${url}:`, error);
          continue;
        }
      }
      
      if (!jsPDFLoaded) {
        throw new Error(`No se pudo cargar jsPDF desde ningún CDN. Último error: ${lastError?.message}`);
      }
      
      // Intentar cargar autotable
      console.log('📥 Cargando plugin AutoTable...');
      let autoTableLoaded = false;
      
      for (let i = 0; i < autoTableUrls.length; i++) {
        const url = autoTableUrls[i];
        try {
          console.log(`📥 Intentando cargar AutoTable desde: ${url}`);
          await this.loadScript(url);
          await new Promise(resolve => setTimeout(resolve, 500));
          console.log(`✅ AutoTable cargado desde: ${url}`);
          autoTableLoaded = true;
          break;
        } catch (error) {
          console.warn(`⚠️ Error cargando AutoTable desde ${url}:`, error);
          continue;
        }
      }
      
      if (!autoTableLoaded) {
        console.warn('⚠️ AutoTable no se pudo cargar, continuando sin plugin de tablas');
      }
      
      // Verificación final
      let finalJsPDF = (window as any).jsPDF || (window as any).jspdf;
      
      // Asegurar que esté disponible como jsPDF para compatibilidad
      if (!finalJsPDF) {
        throw new Error('jsPDF no está disponible después de cargar todos los scripts');
      }
      
      if (!(window as any).jsPDF && (window as any).jspdf) {
        (window as any).jsPDF = (window as any).jspdf;
        finalJsPDF = (window as any).jsPDF;
        console.log('🔧 Normalizando acceso global: jspdf -> jsPDF');
      }
      
      if (finalJsPDF) {
        console.log('🎉 Verificación final exitosa:');
        console.log('- jsPDF tipo:', typeof finalJsPDF);
        console.log('- jsPDF.version:', finalJsPDF.version || 'no disponible');
        console.log('- AutoTable disponible:', typeof finalJsPDF.autoTable);
        
        // Diagnóstico detallado del objeto jsPDF
        console.log('🔍 Diagnóstico detallado del objeto jsPDF:');
        console.log('- Es función constructora:', typeof finalJsPDF === 'function');
        console.log('- Propiedades disponibles:', Object.keys(finalJsPDF));
        console.log('- finalJsPDF.jsPDF:', typeof finalJsPDF.jsPDF);
        console.log('- finalJsPDF.default:', typeof finalJsPDF.default);
        
        // Si es un objeto que contiene la clase, extraerla
        let actualJsPDF = finalJsPDF;
        if (typeof finalJsPDF === 'object' && finalJsPDF.jsPDF) {
          actualJsPDF = finalJsPDF.jsPDF;
          console.log('📦 Encontrada clase jsPDF dentro del objeto, tipo:', typeof actualJsPDF);
        } else if (typeof finalJsPDF === 'object' && finalJsPDF.default) {
          actualJsPDF = finalJsPDF.default;
          console.log('📦 Encontrada clase default dentro del objeto, tipo:', typeof actualJsPDF);
        }
        
        return actualJsPDF;
      } else {
        // Diagnóstico completo
        console.error('❌ Diagnóstico completo:');
        console.log('window.jsPDF:', typeof (window as any).jsPDF);
        console.log('window.jspdf:', typeof (window as any).jspdf);
        console.log('Scripts en head:', Array.from(document.head.querySelectorAll('script')).map(s => s.src));
        throw new Error('jsPDF no está disponible después de cargar todos los scripts');
      }
      
    } catch (error) {
      console.error('❌ Error crítico en loadFromCDN:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`No se pudieron cargar las librerías de PDF desde CDN: ${errorMessage}`);
    }
  }

  /**
   * Carga un script desde una URL con retry y mejor manejo de errores
   */
  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof document === 'undefined') {
        reject(new Error('Document not available'));
        return;
      }

      // Verificar si el script ya existe
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) {
        console.log(`✅ Script ya existe: ${src}`);
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.type = 'text/javascript';
      
      // Timeout de 15 segundos para producción
      const timeout = setTimeout(() => {
        script.remove();
        reject(new Error(`Timeout cargando script (15s): ${src}`));
      }, 15000);
      
      script.onload = () => {
        clearTimeout(timeout);
        console.log(`✅ Script cargado exitosamente: ${src}`);
        resolve();
      };
      
      script.onerror = (error) => {
        clearTimeout(timeout);
        script.remove();
        console.error(`❌ Error cargando script: ${src}`, error);
        reject(new Error(`Failed to load script: ${src}`));
      };
      
      // Intentar cargar con fetch primero para verificar disponibilidad
      fetch(src, { method: 'HEAD', mode: 'no-cors' })
        .then(() => {
          console.log(`🌐 URL verificada, agregando script: ${src}`);
          document.head.appendChild(script);
        })
        .catch((fetchError) => {
          clearTimeout(timeout);
          console.warn(`⚠️ Fetch falló para ${src}:`, fetchError);
          // Intentar cargar de todas formas
          document.head.appendChild(script);
        });
    });
  }

  /**
   * Genera PDF del historial de entregas de un asociado específico
   */
  async generateAssociateDeliveryReport(
    associateName: string, 
    associateId: string, 
    deliveries: DeliveryRecord[]
  ): Promise<void> {
    try {
      console.log('📄 Iniciando generación de reporte de asociado...');
      const jsPDF = await this.loadPdfLibraries();
      const doc = new jsPDF();
      
      // Configurar fuente para soportar caracteres especiales
      doc.setFont('helvetica');
      
      // Añadir encabezado
      const startY = await this.addHeader(doc, 'REPORTE DE ENTREGAS DE DOTACIÓN');
      
      // Información del asociado
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      
      // Limpiar el nombre del asociado eliminando "undefined"
      const cleanAssociateName = associateName ? associateName.replace(/undefined/g, '').replace(/\s+/g, ' ').trim() : 'Sin nombre';
      
      doc.text(`Asociado: ${cleanAssociateName}`, 20, startY);
      doc.text(`Cédula: ${associateId || 'Sin cédula'}`, 20, startY + 10);
      doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-CO')}`, 20, startY + 20);
      
      // Línea separadora
      doc.setLineWidth(0.5);
      doc.line(20, startY + 30, 190, startY + 30);
      
      if (deliveries.length === 0) {
        doc.setFontSize(12);
        doc.text('No hay entregas registradas para este asociado.', 20, startY + 45);
      } else {
        // Crear tabla manualmente si autoTable no está disponible
        const tableEndY = this.createManualTable(doc, deliveries, startY + 40);
        
        // Resumen al final - usar la posición real donde terminó la tabla
        let finalY = tableEndY + 20;
        
        // Verificar si necesitamos nueva página para el resumen
        const pageHeight = doc.internal.pageSize.height;
        if (finalY > pageHeight - 50) {
          doc.addPage();
          finalY = 30;
        }
        
        doc.setFontSize(12);
        doc.setTextColor(44, 62, 80);
        doc.text('RESUMEN:', 20, finalY);
        
        // Contar elementos (incluyendo talla)
        const elementCount = deliveries.reduce((acc, delivery) => {
          const elementoKey = delivery.talla 
            ? `${delivery.elemento} - Talla: ${delivery.talla}`
            : delivery.elemento;
          acc[elementoKey] = (acc[elementoKey] || 0) + delivery.cantidad;
          return acc;
        }, {} as { [key: string]: number });
        
        let summaryY = finalY + 10;
        Object.entries(elementCount).forEach(([elemento, cantidad]) => {
          // Verificar si necesitamos nueva página para cada línea del resumen
          if (summaryY > pageHeight - 30) {
            doc.addPage();
            summaryY = 30;
            // Redibujar el título del resumen en la nueva página
            doc.setFontSize(12);
            doc.setTextColor(44, 62, 80);
            doc.text('RESUMEN (continuación):', 20, summaryY);
            summaryY += 15;
          }
          
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          
          // Truncar nombre del elemento si es muy largo para evitar desbordamiento
          let elementoText = elemento;
          if (elemento.length > 45) {
            elementoText = elemento.substring(0, 42) + '...';
          }
          
          doc.text(`• ${elementoText}: ${cantidad} unidad(es)`, 25, summaryY);
          summaryY += 8;
        });
      }
      
      // Pie de página
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text('Sistema de Control de Dotaciones - Coraza', 105, pageHeight - 10, { align: 'center' });
      
      // Descargar PDF
      doc.save(`Historial_Entregas_${associateName.replace(/\s+/g, '_')}_${associateId}.pdf`);
      
      // Limpiar referencias después de la generación
      await this.finalizePdfGeneration(doc);
      
    } catch (error) {
      console.error('Error generando PDF:', error);
      throw error;
    }
  }

  /**
   * Crea una tabla manual cuando autoTable no está disponible
   */
  private createManualTable(doc: any, deliveries: DeliveryRecord[], startY: number): number {
    const headers = ['Fecha', 'Elemento', 'Cantidad', 'Observaciones'];
    const rowHeight = 8;
    // Ajustar anchos para que quepan en el PDF (ancho útil: 170mm desde x=20 hasta x=190)
    const colWidths = [35, 70, 20, 45]; // Total: 170mm
    let currentY = startY;
    
    // Dibujar encabezados con mejor manejo de colores
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    
    let currentX = 20;
    headers.forEach((header, index) => {
      // Fondo del encabezado
      doc.setFillColor(44, 62, 80); // Azul oscuro
      doc.rect(currentX, currentY, colWidths[index], rowHeight, 'F');
      
      // Texto del encabezado
      doc.setTextColor(255, 255, 255); // Texto blanco
      doc.text(header, currentX + 2, currentY + 5);
      
      // Borde del encabezado
      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.1);
      doc.rect(currentX, currentY, colWidths[index], rowHeight, 'S');
      
      currentX += colWidths[index];
    });
    
    currentY += rowHeight;
    
    // Dibujar filas de datos
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0); // Asegurar texto negro para las filas
    
    deliveries.forEach((delivery, rowIndex) => {
      // Formatear elemento con talla si existe
      const elementoConTalla = delivery.talla 
        ? `${delivery.elemento} - Talla: ${delivery.talla}`
        : delivery.elemento;
      
      const rowData = [
        delivery.fecha,
        elementoConTalla,
        delivery.cantidad.toString(),
        delivery.observaciones || '-'
      ];
      
      // Definir color de fondo para toda la fila
      let rowFillColor: [number, number, number];
      if (rowIndex % 2 === 0) {
        rowFillColor = [250, 250, 250]; // Gris muy claro
      } else {
        rowFillColor = [255, 255, 255]; // Blanco
      }
      
      currentX = 20;
      rowData.forEach((data, colIndex) => {
        // Establecer el color de fondo correcto para esta celda
        doc.setFillColor(rowFillColor[0], rowFillColor[1], rowFillColor[2]);
        
        // Dibujar fondo de celda con el color correcto
        doc.rect(currentX, currentY, colWidths[colIndex], rowHeight, 'F');
        
        // Establecer color de texto negro para esta celda
        doc.setTextColor(0, 0, 0);
        
        // Truncar texto si es muy largo
        let text = data.toString();
        if (text.length > 15 && colIndex === 3) { // Observaciones
          text = text.substring(0, 12) + '...';
        }
        
        // Escribir texto con posición específica según columna
        const textY = currentY + 5;
        const textX = currentX + 2;
        
        // Log para debug (remover después)
        if (rowIndex === 0) {
          console.log(`Columna ${colIndex} (${headers[colIndex]}): escribiendo "${text}" en posición x:${textX}, y:${textY}`);
        }
        
        doc.text(text, textX, textY);
        currentX += colWidths[colIndex];
      });
      
      // Dibujar bordes de las celdas
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.1);
      currentX = 20;
      rowData.forEach((_, colIndex) => {
        doc.rect(currentX, currentY, colWidths[colIndex], rowHeight, 'S');
        currentX += colWidths[colIndex];
      });
      
      currentY += rowHeight;
    });
    
    // Retornar la posición Y donde terminó la tabla
    return currentY;
  }

  /**
   * Genera PDF del reporte general por elemento
   */
  async generateElementSummaryReport(elementSummaries: ElementSummary[]): Promise<void> {
    try {
      console.log('Iniciando generación de reporte general PDF...');
      console.log('Datos recibidos:', elementSummaries);
      
      const jsPDF = await this.loadPdfLibraries();
      console.log('Librerías PDF cargadas exitosamente');
      
      const doc = new jsPDF();
      
      // Configurar fuente
      doc.setFont('helvetica');
      
      // Añadir encabezado
      const startY = await this.addHeader(doc, 'REPORTE GENERAL DE DOTACIONES POR ELEMENTO');
      
      // Información del reporte
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-CO')}`, 20, startY);
      doc.text(`Total de elementos: ${elementSummaries.length}`, 20, startY + 10);
      
      // Línea separadora
      doc.setLineWidth(0.5);
      doc.line(20, startY + 20, 190, startY + 20);
      
      let currentY = startY + 30;
      
      if (!elementSummaries || elementSummaries.length === 0) {
        doc.setFontSize(12);
        doc.text('No hay entregas registradas.', 20, currentY);
      } else {
        elementSummaries.forEach((elementSummary, index) => {
          console.log(`Procesando elemento ${index + 1}:`, elementSummary);
          
          // Verificar si necesitamos nueva página
          if (currentY > 250) {
            doc.addPage();
            currentY = 20;
          }
          
          // Título del elemento
          doc.setFontSize(14);
          doc.setTextColor(44, 62, 80);
          doc.text(`${elementSummary.elemento.toUpperCase()}`, 20, currentY);
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          doc.text(`Total entregado: ${elementSummary.totalEntregado} unidades`, 20, currentY + 8);
          
          currentY += 20;
          
          // Lista simple de entregas
          elementSummary.entregas.forEach((entrega, entregaIndex) => {
            if (currentY > 280) {
              doc.addPage();
              currentY = 20;
            }
            
            doc.setFontSize(8);
            doc.text(`${entrega.fecha} - ${entrega.asociado || 'N/A'} (${entrega.cedula || 'N/A'}) - Cantidad: ${entrega.cantidad}`, 25, currentY);
            currentY += 6;
          });
          
          currentY += 10;
        });
      }
      
      // Pie de página
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text('Sistema de Control de Dotaciones - Coraza', 105, pageHeight - 10, { align: 'center' });
      
      // Descargar PDF
      doc.save(`Reporte_General_Dotaciones_${new Date().toISOString().split('T')[0]}.pdf`);
      
      // Limpiar referencias después de la generación
      await this.finalizePdfGeneration(doc);
      
    } catch (error) {
      console.error('Error generando reporte general:', error);
      throw error;
    }
  }

  /**
   * Genera PDF de reporte de un elemento específico
   */
  async generateSingleElementReport(elemento: string, deliveries: DeliveryRecord[]): Promise<void> {
    try {
      const jsPDF = await this.loadPdfLibraries();
      const doc = new jsPDF();
      
      // Configurar fuente
      doc.setFont('helvetica');
      
      // Añadir encabezado
      const startY = await this.addHeader(doc, `REPORTE DE ENTREGAS: ${elemento.toUpperCase()}`);
      
      // Información del reporte
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Elemento: ${elemento}`, 20, startY);
      doc.text(`Total de entregas: ${deliveries.length}`, 20, startY + 10);
      doc.text(`Cantidad total entregada: ${deliveries.reduce((sum, d) => sum + d.cantidad, 0)} unidades`, 20, startY + 20);
      doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-CO')}`, 20, startY + 30);
      
      // Línea separadora
      doc.setLineWidth(0.5);
      doc.line(20, startY + 40, 190, startY + 40);
      
      if (deliveries.length === 0) {
        doc.setFontSize(12);
        doc.text('No hay entregas registradas para este elemento.', 20, startY + 55);
      } else {
        // Crear tabla manual
        this.createElementTable(doc, deliveries, startY + 50);
      }
      
      // Pie de página
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text('Sistema de Control de Dotaciones - Coraza', 105, pageHeight - 10, { align: 'center' });
      
      // Descargar PDF
      doc.save(`Reporte_${elemento.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      // Limpiar referencias después de la generación
      await this.finalizePdfGeneration(doc);
      
    } catch (error) {
      console.error('Error generando reporte del elemento:', error);
      throw error;
    }
  }

  /**
   * Crea una tabla manual para reportes de elementos
   */
  private createElementTable(doc: any, deliveries: DeliveryRecord[], startY: number): void {
    const headers = ['Fecha', 'Asociado', 'Cédula', 'Cantidad', 'Observaciones'];
    const rowHeight = 8;
    // Ajustar anchos para que quepan en el PDF (ancho útil: 170mm desde x=20 hasta x=190)
    const colWidths = [30, 45, 25, 20, 50]; // Total: 170mm
    let currentY = startY;
    
    // Dibujar encabezados con mejor manejo de colores
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    
    let currentX = 20;
    headers.forEach((header, index) => {
      // Fondo del encabezado
      doc.setFillColor(44, 62, 80); // Azul oscuro
      doc.rect(currentX, currentY, colWidths[index], rowHeight, 'F');
      
      // Texto del encabezado
      doc.setTextColor(255, 255, 255); // Texto blanco
      doc.text(header, currentX + 2, currentY + 5);
      
      // Borde del encabezado
      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.1);
      doc.rect(currentX, currentY, colWidths[index], rowHeight, 'S');
      
      currentX += colWidths[index];
    });
    
    currentY += rowHeight;
    
    // Dibujar filas de datos
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0); // Asegurar texto negro para las filas
    
    deliveries.forEach((delivery, rowIndex) => {
      const rowData = [
        delivery.fecha,
        delivery.asociado || '-',
        delivery.cedula || '-',
        delivery.cantidad.toString(),
        delivery.observaciones || '-'
      ];
      
      // Definir color de fondo para toda la fila
      let rowFillColor: [number, number, number];
      if (rowIndex % 2 === 0) {
        rowFillColor = [250, 250, 250]; // Gris muy claro
      } else {
        rowFillColor = [255, 255, 255]; // Blanco
      }
      
      currentX = 20;
      rowData.forEach((data, colIndex) => {
        // Establecer el color de fondo correcto para esta celda
        doc.setFillColor(rowFillColor[0], rowFillColor[1], rowFillColor[2]);
        
        // Dibujar fondo de celda con el color correcto
        doc.rect(currentX, currentY, colWidths[colIndex], rowHeight, 'F');
        
        // Establecer color de texto negro para esta celda
        doc.setTextColor(0, 0, 0);
        
        // Truncar texto si es muy largo
        let text = data.toString();
        if (text.length > 12 && (colIndex === 1 || colIndex === 4)) { // Asociado o Observaciones
          text = text.substring(0, 9) + '...';
        }
        
        // Escribir texto
        doc.text(text, currentX + 2, currentY + 5);
        currentX += colWidths[colIndex];
      });
      
      // Dibujar bordes de las celdas
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.1);
      currentX = 20;
      rowData.forEach((_, colIndex) => {
        doc.rect(currentX, currentY, colWidths[colIndex], rowHeight, 'S');
        currentX += colWidths[colIndex];
      });
      
      currentY += rowHeight;
      
      // Verificar si necesitamos nueva página
      if (currentY > 270) {
        doc.addPage();
        currentY = 20;
        
        // Redibujar encabezados en nueva página con estilo correcto
        doc.setFont('helvetica', 'bold');
        
        currentX = 20;
        headers.forEach((header, index) => {
          // Fondo del encabezado
          doc.setFillColor(44, 62, 80); // Azul oscuro
          doc.rect(currentX, currentY, colWidths[index], rowHeight, 'F');
          
          // Texto del encabezado
          doc.setTextColor(255, 255, 255); // Texto blanco
          doc.text(header, currentX + 2, currentY + 5);
          
          // Borde del encabezado
          doc.setDrawColor(100, 100, 100);
          doc.setLineWidth(0.1);
          doc.rect(currentX, currentY, colWidths[index], rowHeight, 'S');
          
          currentX += colWidths[index];
        });
        
        currentY += rowHeight;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
      }
    });
  }
}
