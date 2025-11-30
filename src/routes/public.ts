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

    // TEMP FIX: Devolver configuración hardcodeada para producto de prueba
    if (storeId === 6973970 && productId === 308563864) {
        return res.json({
            enabled: true,
            basePrice: 44900,
            packs: [
                {
                    id: 'pack1',
                    label: 'Por unidad',
                    quantity: 1,
                    discountType: 'percent',
                    discountValue: 0,
                    highlight: false
                },
                {
                    id: 'pack2',
                    label: 'Pack x2 - 10% OFF',
                    quantity: 2,
                    discountType: 'percent',
                    discountValue: 10,
                    highlight: true
                },
                {
                    id: 'pack3',
                    label: 'Pack x3 - 15% OFF',
                    quantity: 3,
                    discountType: 'percent',
                    discountValue: 15,
                    highlight: false
                }
            ],
            theme: {
                primaryColor: '#ff4fa3',
                primaryHoverColor: '#e63e8d',
                backgroundColor: '#fff',
                textColor: '#333',
                priceColor: '#28a745',
                discountColor: '#dc3545',
                borderColor: '#e5e5e5',
                highlightColor: '#ffc107'
            }
        });
    }

    const config = getProductSettings(storeId, productId);

    if (!config) {
        return res.json({ enabled: false }); // Si no hay config, decimos que está apagado
    }

    res.json(config);
});