import { Router, Request, Response } from 'express';
import { 
  getProductSettings, 
  saveProductSettings, 
  getDefaultProductSettings 
} from '../store/productSettingsRepo';
import { getStoreToken } from '../store/storeRepo';
import { createOrUpdatePromotion, searchProducts, createOrUpdateDiscountVariant, deleteDiscountVariant, createCartDiscount, getStoreDomain } from '../services/tiendanubeService';
import { env } from '../config/env';
import fetch from 'node-fetch';

export const adminRouter = Router();

// --- DEBUG: Ver token actual ---
adminRouter.get('/debug/token', (req: Request, res: Response) => {
  const storeId = Number(req.query.store_id);
  if (!storeId) {
    return res.status(400).json({ error: 'store_id requerido' });
  }
  
  const token = getStoreToken(storeId) || env.tnAccessToken;
  res.json({ 
    storeId, 
    hasToken: !!token,
    tokenPreview: token ? token.substring(0, 10) + '...' : 'none',
    fullToken: token 
  });
});

// --- POST: Instalar script en la tienda ---
adminRouter.post('/install-script', async (req: Request, res: Response) => {
  const storeId = Number(req.body.store_id);
  
  if (!storeId) {
    return res.status(400).json({ error: 'store_id requerido' });
  }

  const token = getStoreToken(storeId) || env.tnAccessToken;
  
  try {
    // Verificar si ya existe el script
    const checkResponse = await fetch(`https://api.tiendanube.com/v1/${storeId}/scripts`, {
      headers: {
        'Authentication': `bearer ${token}`,
        'User-Agent': 'TN Bundles App (imanolkremis505@gmail.com)'
      }
    });
    
    const scripts = await checkResponse.json() as any[];
    const existingScript = scripts.find(s => s.src && s.src.includes('widget.js'));
    
    if (existingScript) {
      console.log(`[Install] Script ya existe con ID ${existingScript.id}`);
      return res.json({ success: true, scriptId: existingScript.id, message: 'Script ya instalado' });
    }
    
    // Crear el script
    const createResponse = await fetch(`https://api.tiendanube.com/v1/${storeId}/scripts`, {
      method: 'POST',
      headers: {
        'Authentication': `bearer ${token}`,
        'User-Agent': 'TN Bundles App (imanolkremis505@gmail.com)',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        src: `${env.appBaseUrl}/widget.js`,
        event: 'onload',
        where: 'store'
      })
    });
    
    const script = await createResponse.json();
    console.log(`[Install] ✅ Script instalado con ID ${script.id}`);
    
    res.json({ success: true, scriptId: script.id, message: 'Script instalado correctamente' });
  } catch (error: any) {
    console.error(`[Install] Error:`, error);
    res.status(500).json({ error: error.message });
  }
});

// --- GET: Buscar productos (Upsells) ---
adminRouter.get('/products/search', async (req: Request, res: Response) => {
    const storeId = Number(req.query.store_id);
    // Permitimos query vacío para el dropdown (si es undefined, usamos '')
    const query = (req.query.q as string) || ''; 

    if (!storeId) { 
        return res.status(400).json([]);
    }

    // Llamamos al servicio con el query (aunque esté vacío)
    const results = await searchProducts(storeId, query);
    res.json(results);
});

// --- GET: Obtener configuración ---
adminRouter.get('/config', (req: Request, res: Response) => {
  const storeId = Number(req.query.store_id);
  const productId = Number(req.query.product_id);

  if (!storeId || !productId) {
    return res.status(400).json({ error: 'Faltan parámetros store_id o product_id' });
  }

  let config = getProductSettings(storeId, productId);

  if (!config) {
    console.log(`[Admin API] Config no encontrada. Creando default...`);
    config = getDefaultProductSettings(storeId, productId);
    saveProductSettings(config);
  }

  res.json(config);
});

// --- POST: Guardar configuración ---
adminRouter.post('/config', async (req: Request, res: Response) => {
  const body = req.body;
  const storeId = Number(body.storeId);
  const productId = Number(body.productId);

  if (!storeId || !productId) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  console.log(`[Admin API] Procesando configuración...`);

  // Crear cupones automáticos para upsells con descuento
  if (body.packs && Array.isArray(body.packs)) {
      for (const pack of body.packs) {
          if (pack.upsells && Array.isArray(pack.upsells)) {
              for (const upsell of pack.upsells) {
                  // Si el upsell está activo y tiene descuento, crear cupón
                  if (upsell.enabled !== false && upsell.discountValue > 0) {
                      console.log(`[Cupón] Creando cupón automático para upsell ${upsell.id}...`);
                      const couponCode = await createCartDiscount(storeId, {
                          productId: upsell.id,
                          discountValue: upsell.discountValue,
                          discountType: upsell.discountType || 'percent'
                      });
                      
                      if (couponCode) {
                          upsell.couponCode = couponCode;
                          console.log(`[Cupón] ✅ Cupón ${couponCode} asignado a upsell ${upsell.id}`);
                      }
                  }
              }
          }
      }
  }
  
  // Crear promociones automáticas para packs con descuento
  if (body.packs && Array.isArray(body.packs)) {
      for (const pack of body.packs) {
          // Solo crear promo si tiene descuento real (>0) y es un pack (>1 unidad)
          if (pack.quantity > 1 && pack.discountValue > 0) {
              console.log(`[Admin] Creando promoción para ${pack.label}: ${pack.quantity} x ${pack.discountValue}${pack.discountType === 'percent' ? '%' : '$'}`);
              
              await createOrUpdatePromotion(storeId, {
                  name: pack.label,
                  quantity: pack.quantity,
                  discountValue: pack.discountValue,
                  discountType: pack.discountType,
                  productId: productId
              });
          }
      }
  }

  saveProductSettings(body);
  
  // Obtener URL de la tienda para el popup
  const storeUrl = await getStoreDomain(storeId, getStoreToken(storeId) || env.tnAccessToken);
  
  res.json({
      ...body,
      storeUrl: storeUrl
  });
});