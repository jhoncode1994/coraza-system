export const TALLAS_CONFIG = {
  // Botas: 34-45
  botas: ['34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
  
  // Camisas: Mujer 6-16, Hombre 28-50 (pares)
  camisa: ['6', '8', '10', '12', '14', '16', '28', '30', '32', '34', '36', '38', '40', '42', '44', '46', '48', '50'],
  
  // Pantalones: Mujer 6-16, Hombre 28-50 (pares)
  pantalon: ['6', '8', '10', '12', '14', '16', '28', '30', '32', '34', '36', '38', '40', '42', '44', '46', '48', '50'],
  
  // Overoles: 28-50 (pares, sin género)
  overol: ['28', '30', '32', '34', '36', '38', '40', '42', '44', '46', '48', '50'],
  
  // Chaquetas: mantener por si acaso
  chaqueta: ['28', '30', '32', '34', '36', '38', '40', '42', '44', '46', '48', '50']
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