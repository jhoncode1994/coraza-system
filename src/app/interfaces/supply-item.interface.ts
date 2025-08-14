export interface SupplyItem {
  id: number;
  name: string;
  quantity: number;
  description?: string;
  lastUpdate?: Date;
  minimumQuantity?: number;
  code?: string;
  category?: 'uniforme' | 'accesorios';
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
