export const TALLAS_CONFIG = {
  botas: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
  camisa: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  chaqueta: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  overol: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  pantalon: ['28', '30', '32', '34', '36', '38', '40', '42', '44']
};

export const ELEMENTOS_CON_TALLA = ['botas', 'camisa', 'chaqueta', 'overol', 'pantalon'];

export function requiereTalla(tipo: string): boolean {
  return ELEMENTOS_CON_TALLA.includes(tipo.toLowerCase());
}

export function getTallasDisponibles(tipo: string): string[] {
  return TALLAS_CONFIG[tipo.toLowerCase() as keyof typeof TALLAS_CONFIG] || [];
}

export function getDisplayName(tipo: string, talla?: string): string {
  const nombre = tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase();
  return talla ? `${nombre} - ${talla}` : nombre;
}