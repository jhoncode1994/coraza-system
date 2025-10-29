export interface SupplyItem {
  id: number;
  name: string;
  quantity: number;
  description?: string;
  lastUpdate?: Date;
  minimumQuantity?: number;
  code: string;
  category: string;
  talla?: string;  // Nueva propiedad para talla
  genero?: 'M' | 'F' | null;  // Género para botas: M=Hombre, F=Mujer
  // API response fields (snake_case)
  minimum_quantity?: number;
  last_update?: string;
  unit_price?: number;
  created_at?: string;
}

export type SupplyItemType = 
  'camisa' | 
  'corbata' | 
  'apellido' | 
  'pantalon' | 
  'cinturon' | 
  'kepis' | 
  'moña' | 
  'botas' | 
  'reata' | 
  'goleana';
