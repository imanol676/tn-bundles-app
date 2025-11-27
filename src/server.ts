import express from 'express';
import cors from 'cors';
import path from 'path';
import fetch from 'node-fetch';

// Importamos tus rutas
import { adminRouter } from './routes/admin';
import { authRouter } from './routes/auth'; 
import { publicRouter } from './routes/public'; // <--- IMPORTANTE: La ruta del Widget

const app = express();
const PORT = process.env.PORT || 4000;

// 1. Middlewares Base
app.use(cors());
app.use(express.json());

// 2. Logger Visual (Para ver qué pasa en la consola)
app.use((req, res, next) => {
    console.log(`📢 [PETICIÓN] ${req.method} ${req.url}`);
    next();
});

// 3. Archivos Estáticos (Tu admin.html, widget.js, etc.)
app.use('/static', express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../public'))); // También servir en raíz

// 4. RUTAS DE LA API (El corazón de la app)
app.use('/admin', adminRouter);   // Para el panel de configuración
app.use('/auth', authRouter);     // Para instalar la app
app.use('/public', publicRouter); // <--- CRÍTICO: Para que el widget lea la config

// 5. Manejo de 404 (Por si escribes mal una URL)
app.use((req, res) => {
    console.warn(`⚠️ [404] ALERTA: No se encontró la ruta ${req.url}`);
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// 6. Iniciar Servidor
app.listen(PORT, () => {
    console.log(`\n--------------------------------------------------`);
    console.log(`🚀 Servidor listo en: http://localhost:${PORT}`);
    console.log(`📂 Archivos públicos: http://localhost:${PORT}/static`);
    console.log(`--------------------------------------------------`);
    
    // Intentar obtener la URL de ngrok automáticamente
    setTimeout(async () => {
        try {
            const response = await fetch('http://127.0.0.1:4040/api/tunnels');
            const data: any = await response.json();
            const httpsUrl = data.tunnels?.find((t: any) => t.proto === 'https')?.public_url;
            
            if (httpsUrl) {
                console.log(`\n🌐 NGROK URL DETECTADA:`);
                console.log(`📡 ${httpsUrl}`);
                console.log(`\n🔗 LINK DE INSTALACIÓN (Cópialo):`);
                console.log(`${httpsUrl}/auth/install?store_id=6973970`);
                console.log(`--------------------------------------------------\n`);
            }
        } catch (e) {
            console.log(`⚠️  Ngrok no detectado. Usa: http://localhost:${PORT}/auth/install?store_id=6973970`);
        }
    }, 1000);
});