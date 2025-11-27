import fs from 'fs';
import path from 'path';
import { ProductSettings } from '../models/productSettings';

// Ruta al archivo de base de datos
const DB_PATH = path.join(__dirname, '../../database.json');

// Función auxiliar para leer la DB
function readDb(): Record<string, ProductSettings> {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return {};
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error leyendo DB:', error);
    return {};
  }
}

// Función auxiliar para escribir en la DB
function writeDb(data: Record<string, ProductSettings>) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error escribiendo DB:', error);
  }
}

function makeKey(storeId: number, productId: number) {
  return `${storeId}:${productId}`;
}

// Obtener configuración
export function getProductSettings(storeId: number, productId: number): ProductSettings | undefined {
  const db = readDb();
  const key = makeKey(storeId, productId);
  return db[key];
}

// Guardar / actualizar configuración
export function saveProductSettings(settings: ProductSettings): void {
  const db = readDb();
  const key = makeKey(settings.storeId, settings.productId);
  db[key] = settings;
  writeDb(db);
  console.log(`[Repo] Configuración guardada en disco para ${key}`);
}

// Generar una config por defecto
export function getDefaultProductSettings(storeId: number, productId: number): ProductSettings {
  return {
    storeId,
    productId,
    enabled: true,
    basePrice: 0,
    packs: [
      {
        id: 'pack1',
        label: 'Por unidad',
        quantity: 1,
        discountType: 'none',
        discountValue: 0,
        highlight: false,
        freeShippingBadge: false,
        couponCode: '',
        upsellIds: []
      },
      {
        id: 'pack2',
        label: 'Pack X2',
        quantity: 2,
        discountType: 'percent',
        discountValue: 10,
        highlight: false,
        freeShippingBadge: false,
        couponCode: '',
        upsellIds: []
      },
      {
        id: 'pack3',
        label: 'Pack X3',
        quantity: 3,
        discountType: 'percent',
        discountValue: 20,
        highlight: true,
        freeShippingBadge: true,
        couponCode: '',
        upsellIds: []
      }
    ],
    upsells: [],
    theme: {
      primaryColor: '#007bff',
      primaryHoverColor: '#0056b3',
      backgroundColor: '#ffffff',
      textColor: '#333333',
      priceColor: '#28a745',
      discountColor: '#dc3545',
      borderColor: '#dee2e6',
      highlightColor: '#ffc107'
    }
  };
}