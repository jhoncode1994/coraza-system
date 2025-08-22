import { Injectable } from '@angular/core';

export interface DeliveryRecord {
  fecha: string;
  elemento: string;
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
   * Verifica si las librerías de PDF están disponibles y las carga si es necesario
   */
  private async loadPdfLibraries(): Promise<any> {
    console.log('🔄 Iniciando carga de librerías PDF...');
    
    // Verificar si jsPDF ya está disponible globalmente
    if (typeof window !== 'undefined' && (window as any).jsPDF) {
      console.log('✅ jsPDF ya está disponible globalmente');
      return (window as any).jsPDF;
    }

    // Para producción, usar solo CDN que es más confiable
    return this.loadFromCDN();
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
      const finalJsPDF = (window as any).jsPDF;
      if (finalJsPDF) {
        console.log('🎉 Verificación final exitosa:');
        console.log('- jsPDF tipo:', typeof finalJsPDF);
        console.log('- jsPDF.version:', finalJsPDF.version || 'no disponible');
        console.log('- AutoTable disponible:', typeof finalJsPDF.autoTable);
        return finalJsPDF;
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
      const jsPDF = await this.loadPdfLibraries();
      const doc = new jsPDF();
      
      // Configurar fuente para soportar caracteres especiales
      doc.setFont('helvetica');
      
      // Título del documento
      doc.setFontSize(18);
      doc.setTextColor(44, 62, 80);
      doc.text('REPORTE DE ENTREGAS DE DOTACIÓN', 105, 20, { align: 'center' });
      
      // Información del asociado
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Asociado: ${associateName}`, 20, 35);
      doc.text(`Cédula: ${associateId}`, 20, 45);
      doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-CO')}`, 20, 55);
      
      // Línea separadora
      doc.setLineWidth(0.5);
      doc.line(20, 65, 190, 65);
      
      if (deliveries.length === 0) {
        doc.setFontSize(12);
        doc.text('No hay entregas registradas para este asociado.', 20, 80);
      } else {
        // Crear tabla manualmente si autoTable no está disponible
        this.createManualTable(doc, deliveries, 75);
        
        // Resumen al final
        const finalY = 75 + (deliveries.length * 10) + 30;
        doc.setFontSize(12);
        doc.setTextColor(44, 62, 80);
        doc.text('RESUMEN:', 20, finalY);
        
        // Contar elementos
        const elementCount = deliveries.reduce((acc, delivery) => {
          acc[delivery.elemento] = (acc[delivery.elemento] || 0) + delivery.cantidad;
          return acc;
        }, {} as { [key: string]: number });
        
        let summaryY = finalY + 10;
        Object.entries(elementCount).forEach(([elemento, cantidad]) => {
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          doc.text(`• ${elemento}: ${cantidad} unidad(es)`, 25, summaryY);
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
    } catch (error) {
      console.error('Error generando PDF:', error);
      throw error;
    }
  }

  /**
   * Crea una tabla manual cuando autoTable no está disponible
   */
  private createManualTable(doc: any, deliveries: DeliveryRecord[], startY: number): void {
    const headers = ['Fecha', 'Elemento', 'Cantidad', 'Observaciones'];
    const rowHeight = 8;
    const colWidths = [40, 80, 25, 45];
    let currentY = startY;
    
    // Dibujar encabezados
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(44, 62, 80);
    doc.setTextColor(255, 255, 255);
    
    let currentX = 20;
    headers.forEach((header, index) => {
      doc.rect(currentX, currentY, colWidths[index], rowHeight, 'F');
      doc.text(header, currentX + 2, currentY + 5);
      currentX += colWidths[index];
    });
    
    currentY += rowHeight;
    
    // Dibujar filas de datos
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    deliveries.forEach((delivery, rowIndex) => {
      const rowData = [
        delivery.fecha,
        delivery.elemento,
        delivery.cantidad.toString(),
        delivery.observaciones || '-'
      ];
      
      // Alternar colores de fila
      if (rowIndex % 2 === 0) {
        doc.setFillColor(245, 245, 245);
      } else {
        doc.setFillColor(255, 255, 255);
      }
      
      currentX = 20;
      rowData.forEach((data, colIndex) => {
        doc.rect(currentX, currentY, colWidths[colIndex], rowHeight, 'F');
        
        // Truncar texto si es muy largo
        let text = data.toString();
        if (text.length > 15 && colIndex === 3) { // Observaciones
          text = text.substring(0, 12) + '...';
        }
        
        doc.text(text, currentX + 2, currentY + 5);
        currentX += colWidths[colIndex];
      });
      
      currentY += rowHeight;
    });
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
      
      // Título del documento
      doc.setFontSize(18);
      doc.setTextColor(44, 62, 80);
      doc.text('REPORTE GENERAL DE DOTACIONES POR ELEMENTO', 105, 20, { align: 'center' });
      
      // Información del reporte
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-CO')}`, 20, 35);
      doc.text(`Total de elementos: ${elementSummaries.length}`, 20, 45);
      
      // Línea separadora
      doc.setLineWidth(0.5);
      doc.line(20, 55, 190, 55);
      
      let currentY = 65;
      
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
      
      // Título del documento
      doc.setFontSize(18);
      doc.setTextColor(44, 62, 80);
      doc.text(`REPORTE DE ENTREGAS: ${elemento.toUpperCase()}`, 105, 20, { align: 'center' });
      
      // Información del reporte
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Elemento: ${elemento}`, 20, 35);
      doc.text(`Total de entregas: ${deliveries.length}`, 20, 45);
      doc.text(`Cantidad total entregada: ${deliveries.reduce((sum, d) => sum + d.cantidad, 0)} unidades`, 20, 55);
      doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-CO')}`, 20, 65);
      
      // Línea separadora
      doc.setLineWidth(0.5);
      doc.line(20, 75, 190, 75);
      
      if (deliveries.length === 0) {
        doc.setFontSize(12);
        doc.text('No hay entregas registradas para este elemento.', 20, 90);
      } else {
        // Crear tabla manual
        this.createElementTable(doc, deliveries, 85);
      }
      
      // Pie de página
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text('Sistema de Control de Dotaciones - Coraza', 105, pageHeight - 10, { align: 'center' });
      
      // Descargar PDF
      doc.save(`Reporte_${elemento.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
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
    const colWidths = [35, 50, 30, 25, 50];
    let currentY = startY;
    
    // Dibujar encabezados
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(44, 62, 80);
    doc.setTextColor(255, 255, 255);
    
    let currentX = 20;
    headers.forEach((header, index) => {
      doc.rect(currentX, currentY, colWidths[index], rowHeight, 'F');
      doc.text(header, currentX + 2, currentY + 5);
      currentX += colWidths[index];
    });
    
    currentY += rowHeight;
    
    // Dibujar filas de datos
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    deliveries.forEach((delivery, rowIndex) => {
      const rowData = [
        delivery.fecha,
        delivery.asociado || '-',
        delivery.cedula || '-',
        delivery.cantidad.toString(),
        delivery.observaciones || '-'
      ];
      
      // Alternar colores de fila
      if (rowIndex % 2 === 0) {
        doc.setFillColor(245, 245, 245);
      } else {
        doc.setFillColor(255, 255, 255);
      }
      
      currentX = 20;
      rowData.forEach((data, colIndex) => {
        doc.rect(currentX, currentY, colWidths[colIndex], rowHeight, 'F');
        
        // Truncar texto si es muy largo
        let text = data.toString();
        if (text.length > 12 && (colIndex === 1 || colIndex === 4)) { // Asociado o Observaciones
          text = text.substring(0, 9) + '...';
        }
        
        doc.text(text, currentX + 2, currentY + 5);
        currentX += colWidths[colIndex];
      });
      
      currentY += rowHeight;
      
      // Verificar si necesitamos nueva página
      if (currentY > 270) {
        doc.addPage();
        currentY = 20;
        
        // Redibujar encabezados en nueva página
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(44, 62, 80);
        doc.setTextColor(255, 255, 255);
        
        currentX = 20;
        headers.forEach((header, index) => {
          doc.rect(currentX, currentY, colWidths[index], rowHeight, 'F');
          doc.text(header, currentX + 2, currentY + 5);
          currentX += colWidths[index];
        });
        
        currentY += rowHeight;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
      }
    });
  }
}
