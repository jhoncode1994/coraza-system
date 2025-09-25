export const TALLAS_CONFIG = {
  botas: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
  camisa: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  chaqueta: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  overol: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  pantalon: ['28', '30', '32', '34', '36', '38', '40', '42', '44']
};

export const ELEMENTOS_CON_TALLA = ['botas', 'camisa', 'chaqueta', 'overol', 'pantalon'];

export function requiereTalla(tipo: string): boolean {
  if (!tipo) return false;
  
  const tipoLower = tipo.toLowerCase().trim();
  
  // Buscar coincidencias exactas primero
  if (ELEMENTOS_CON_TALLA.includes(tipoLower)) {
    return true;
  }
  
  // Categorías especiales de la base de datos
  if (tipoLower === 'uniforme' || tipoLower === 'calzado') {
    return true;
  }
  
  // Buscar coincidencias parciales para mayor flexibilidad
  const coincidencias = [
    { palabras: ['pantalon', 'pantalón'], categoria: 'pantalon' },
    { palabras: ['camisa', 'camisas'], categoria: 'camisa' },
    { palabras: ['chaqueta', 'chaquetas', 'jacket'], categoria: 'chaqueta' },
    { palabras: ['overol', 'overoles', 'overall'], categoria: 'overol' },
    { palabras: ['bota', 'botas', 'zapato', 'zapatos', 'calzado'], categoria: 'botas' }
  ];
  
  for (const grupo of coincidencias) {
    for (const palabra of grupo.palabras) {
      if (tipoLower.includes(palabra)) {
        return true;
      }
    }
  }
  
  return false;
}

export function getTallasDisponibles(tipo: string): string[] {
  if (!tipo) return [];
  
  const tipoLower = tipo.toLowerCase().trim();
  
  // Buscar coincidencias exactas primero
  const tallasExactas = TALLAS_CONFIG[tipoLower as keyof typeof TALLAS_CONFIG];
  if (tallasExactas) {
    return tallasExactas;
  }
  
  // Buscar coincidencias parciales
  const coincidencias = [
    { palabras: ['pantalon', 'pantalón'], categoria: 'pantalon' },
    { palabras: ['camisa', 'camisas'], categoria: 'camisa' },
    { palabras: ['chaqueta', 'chaquetas', 'jacket'], categoria: 'chaqueta' },
    { palabras: ['overol', 'overoles', 'overall'], categoria: 'overol' },
    { palabras: ['bota', 'botas', 'zapato', 'zapatos', 'calzado'], categoria: 'botas' }
  ];
  
  for (const grupo of coincidencias) {
    for (const palabra of grupo.palabras) {
      if (tipoLower.includes(palabra)) {
        return TALLAS_CONFIG[grupo.categoria as keyof typeof TALLAS_CONFIG] || [];
      }
    }
  }
  
  return [];
}

export function getDisplayName(tipo: string, talla?: string): string {
  const nombre = tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase();
  return talla ? `${nombre} - ${talla}` : nombre;
}