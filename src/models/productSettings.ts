// Tipos de descuento
export type DiscountType = 'none' | 'percent' | 'fixed_amount' | 'fixed_price';

// Config de cada pack
export interface PackConfig {
  id: string;                 // 'pack1', 'pack2', etc.
  label: string;              // "Por unidad", "Pack X2", "Pack X3"
  quantity: number;           // cantidad de unidades en el pack
  discountType: DiscountType; // tipo de descuento
  discountValue: number;      // valor del descuento (según tipo)
  highlight: boolean;         // mostrar "Más elegido"
  freeShippingBadge: boolean; // mostrar etiqueta "Envío Gratis"
  
  // --- CAMPOS NUEVOS ---
  couponCode?: string;        // <--- NUEVO: Para aplicar descuento real en checkout
  upsellIds?: string[];       // <--- NUEVO: Array de IDs de upsells activos en este pack (['upsell1'])
}

// Config de upsell (ACTUALIZADO para coincidir con admin.html)
export interface UpsellConfig {
  id: string;                 // <--- NUEVO: 'upsell1', 'upsell2'
  enabled: boolean;
  name?: string;              // <--- NUEVO: Nombre visual del upsell
  
  // Datos de producto real en Tiendanube
  productId: number | null;   
  variantId?: number | null;  // <--- NUEVO: IMPORTANTE para agregar al carrito
  
  // Precios visuales
  originalPrice?: number;     // <--- NUEVO: Precio tachado
  basePrice?: number;         // <--- NUEVO: Precio final ofertado
  
  // (Opcional) Si quisieras calcular dinámicamente en backend
  discountType?: DiscountType;
  discountValue?: number;
}

// Config de colores / tema
export interface ThemeConfig {
  primaryColor: string;
  backgroundColor: string;    // Nota: en admin era 'background' a veces, asegúrate que coincida
  textColor: string;
  tagPopularColor: string;
  tagFreeShippingColor: string;
  // accentColor lo quité si no lo usas en el admin, o déjalo si lo usas
}

// Config completa para un producto en una tienda
export interface ProductSettings {
  storeId: number;            // id de tienda Tiendanube
  productId: number;          // id de producto Tiendanube
  enabled: boolean;           // si está activo el widget o no
  
  basePrice?: number;         // <--- NUEVO: Precio base del producto principal (usado en cálculos)

  packs: PackConfig[];
  
  // CAMBIO IMPORTANTE: Ahora es un array para soportar varios upsells
  upsells: UpsellConfig[];    // <--- ANTES era "upsell: UpsellConfig"
  
  theme: ThemeConfig;
}