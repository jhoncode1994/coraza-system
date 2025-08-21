import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

@Injectable({
  providedIn: 'root'
})
export class PdfReportService {

  constructor() { }

  /**
   * Genera PDF del historial de entregas de un asociado específico
   */
  generateAssociateDeliveryReport(
    associateName: string, 
    associateId: string, 
    deliveries: DeliveryRecord[]
  ): void {
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
      // Tabla de entregas
      const tableData = deliveries.map(delivery => [
        delivery.fecha,
        delivery.elemento,
        delivery.cantidad.toString(),
        delivery.observaciones || '-'
      ]);
      
      autoTable(doc, {
        head: [['Fecha', 'Elemento', 'Cantidad', 'Observaciones']],
        body: tableData,
        startY: 75,
        theme: 'striped',
        headStyles: {
          fillColor: [44, 62, 80],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 10,
          cellPadding: 5
        },
        columnStyles: {
          0: { cellWidth: 40 }, // Fecha
          1: { cellWidth: 80 }, // Elemento
          2: { cellWidth: 25 }, // Cantidad
          3: { cellWidth: 45 }  // Observaciones
        }
      });
      
      // Resumen al final
      const finalY = (doc as any).lastAutoTable.finalY + 20;
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
  }

  /**
   * Genera PDF del reporte general por elemento
   */
  generateElementSummaryReport(elementSummaries: ElementSummary[]): void {
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
    
    if (elementSummaries.length === 0) {
      doc.setFontSize(12);
      doc.text('No hay entregas registradas.', 20, currentY);
    } else {
      elementSummaries.forEach((elementSummary, index) => {
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
        
        // Tabla de entregas para este elemento
        const tableData = elementSummary.entregas.map(delivery => [
          delivery.fecha,
          delivery.asociado || '-',
          delivery.cedula || '-',
          delivery.cantidad.toString(),
          delivery.observaciones || '-'
        ]);
        
        autoTable(doc, {
          head: [['Fecha', 'Asociado', 'Cédula', 'Cantidad', 'Observaciones']],
          body: tableData,
          startY: currentY,
          theme: 'striped',
          headStyles: {
            fillColor: [44, 62, 80],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          styles: {
            fontSize: 8,
            cellPadding: 3
          },
          columnStyles: {
            0: { cellWidth: 30 }, // Fecha
            1: { cellWidth: 50 }, // Asociado
            2: { cellWidth: 30 }, // Cédula
            3: { cellWidth: 20 }, // Cantidad
            4: { cellWidth: 60 }  // Observaciones
          }
        });
        
        currentY = (doc as any).lastAutoTable.finalY + 15;
      });
    }
    
    // Pie de página en todas las páginas
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text('Sistema de Control de Dotaciones - Coraza', 105, pageHeight - 10, { align: 'center' });
      doc.text(`Página ${i} de ${totalPages}`, 190, pageHeight - 10, { align: 'right' });
    }
    
    // Descargar PDF
    doc.save(`Reporte_General_Dotaciones_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  /**
   * Genera PDF de reporte de un elemento específico
   */
  generateSingleElementReport(elemento: string, deliveries: DeliveryRecord[]): void {
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
      // Tabla de entregas
      const tableData = deliveries.map(delivery => [
        delivery.fecha,
        delivery.asociado || '-',
        delivery.cedula || '-',
        delivery.cantidad.toString(),
        delivery.observaciones || '-'
      ]);
      
      autoTable(doc, {
        head: [['Fecha', 'Asociado', 'Cédula', 'Cantidad', 'Observaciones']],
        body: tableData,
        startY: 85,
        theme: 'striped',
        headStyles: {
          fillColor: [44, 62, 80],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 10,
          cellPadding: 5
        },
        columnStyles: {
          0: { cellWidth: 35 }, // Fecha
          1: { cellWidth: 50 }, // Asociado
          2: { cellWidth: 30 }, // Cédula
          3: { cellWidth: 25 }, // Cantidad
          4: { cellWidth: 50 }  // Observaciones
        }
      });
    }
    
    // Pie de página
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Sistema de Control de Dotaciones - Coraza', 105, pageHeight - 10, { align: 'center' });
    
    // Descargar PDF
    doc.save(`Reporte_${elemento.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  }
}
