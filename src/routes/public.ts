import { Router, Request, Response } from 'express';
import { getProductSettings } from '../store/productSettingsRepo';

export const publicRouter = Router();

// GET /public/config
// Esta es la ruta que consulta el widget.js desde la tienda
publicRouter.get('/config', (req: Request, res: Response) => {
    // Permitimos acceso desde cualquier origen (CORS) para que funcione en la tienda
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const storeId = Number(req.query.store_id);
    const productId = Number(req.query.product_id);

    console.log(`[Public API] Widget solicitando config para Store: ${storeId}, Prod: ${productId}`);

    if (!storeId || !productId) {
        return res.status(400).json({ error: 'Faltan parámetros' });
    }

    const config = getProductSettings(storeId, productId);

    if (!config) {
        return res.json({ enabled: false }); // Si no hay config, decimos que está apagado
    }

    res.json(config);
});