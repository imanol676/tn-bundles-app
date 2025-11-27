import fs from 'fs';
import path from 'path';

// Base de datos persistente en database.json (solo funciona en local)
const DB_PATH = path.join(__dirname, '../../database.json');

// Cache en memoria para producción
const memoryCache = new Map<number, { accessToken: string; updatedAt: string }>();

interface StoreData {
  accessToken: string;
}

function readDatabase(): any {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    console.warn('[StoreRepo] No se pudo leer database.json, usando memoria');
    return {};
  }
}

function writeDatabase(data: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (e) {
    console.warn('[StoreRepo] No se pudo escribir database.json (filesystem read-only)');
  }
}

export function saveStore(storeId: number, accessToken: string) {
  // Guardar en memoria (siempre funciona)
  memoryCache.set(storeId, {
    accessToken,
    updatedAt: new Date().toISOString()
  });
  
  // Intentar guardar en archivo (solo funciona en local)
  try {
    const db = readDatabase();
    const storeKey = `store_${storeId}`;
    
    db[storeKey] = {
      storeId,
      accessToken,
      updatedAt: new Date().toISOString()
    };
    
    writeDatabase(db);
    console.log(`[StoreRepo] ✅ Tienda ${storeId} guardada en database.json y memoria`);
  } catch (e) {
    console.log(`[StoreRepo] ✅ Tienda ${storeId} guardada en memoria`);
  }
}

export function getStoreToken(storeId: number): string | undefined {
  // Primero intentar memoria
  const cached = memoryCache.get(storeId);
  if (cached) {
    return cached.accessToken;
  }
  
  // Si no está en memoria, intentar database.json
  try {
    const db = readDatabase();
    const storeKey = `store_${storeId}`;
    return db[storeKey]?.accessToken;
  } catch (e) {
    return undefined;
  }
}