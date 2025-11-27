import express from 'express';
import { env } from '../config/env';
import { saveStore } from '../store/storeRepo';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

export const authRouter = express.Router();

authRouter.get('/install', (req, res) => {
  const { store_id } = req.query;
  if (!store_id) return res.status(400).send('Falta store_id en la query');
  
  const authorizeUrl = `https://www.tiendanube.com/apps/${env.tnClientId}/authorize?state=${store_id}`;
  return res.redirect(authorizeUrl);
});

authRouter.get('/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) return res.status(400).send('Falta código');

  try {
    const response = await fetch('https://www.tiendanube.com/apps/authorize/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: env.tnClientId,
        client_secret: env.tnClientSecret,
        grant_type: 'authorization_code',
        code
      })
    });

    const json: any = await response.json();
    
    if (json.access_token) {
        const storeId = Number(json.user_id);
        saveStore(storeId, json.access_token);

        // --- INSTALAR SCRIPT EN LA TIENDA ---
        try {
            const scriptUrl = `${env.appBaseUrl}/widget.js`;
            
            // Verificar si ya existe el script
            const checkResponse = await fetch(`https://api.tiendanube.com/v1/${storeId}/scripts`, {
                headers: {
                    'Authentication': `bearer ${json.access_token}`,
                    'User-Agent': 'TN Bundles App (contacto@example.com)'
                }
            });
            
            const scriptsData = await checkResponse.json() as any;
            const existingScripts = scriptsData.result || [];
            const scriptExists = existingScripts.some((s: any) => s.src && s.src.includes('widget.js'));
            
            if (scriptExists) {
                console.log('ℹ️ Script ya existe en la tienda');
            } else {
                const scriptResponse = await fetch(`https://api.tiendanube.com/v1/${storeId}/scripts`, {
                    method: 'POST',
                    headers: {
                        'Authentication': `bearer ${json.access_token}`,
                        'Content-Type': 'application/json',
                        'User-Agent': 'TN Bundles App (contacto@example.com)'
                    },
                    body: JSON.stringify({
                        src: scriptUrl,
                        event: 'onfirstinteraction',
                        where: 'store'
                    })
                });
                
                if (scriptResponse.ok) {
                    const scriptResult = await scriptResponse.json() as any;
                    console.log('✅ Script instalado automáticamente en la tienda - ID:', scriptResult.id);
                } else {
                    const scriptError = await scriptResponse.text();
                    console.error('⚠️ Error instalando script:', scriptError);
                }
            }
        } catch (scriptErr) {
            console.error('⚠️ Error instalando script:', scriptErr);
        }

        // --- GUARDAR TOKEN EN .ENV AUTOMÁTICAMENTE ---
        try {
            const envPath = path.join(__dirname, '../../.env');
            let envContent = fs.readFileSync(envPath, 'utf-8');
            
            // Actualizar o agregar TN_ACCESS_TOKEN
            if (envContent.includes('TN_ACCESS_TOKEN=')) {
                envContent = envContent.replace(/TN_ACCESS_TOKEN=.*/g, `TN_ACCESS_TOKEN=${json.access_token}`);
            } else {
                envContent += `\nTN_ACCESS_TOKEN=${json.access_token}`;
            }
            
            fs.writeFileSync(envPath, envContent);
            console.log('✅ Token guardado automáticamente en .env');
        } catch (err) {
            console.error('⚠️ Error guardando en .env:', err);
        }

        // --- MOSTRAR EN CONSOLA ---
        console.log('\n\n🎉🎉🎉 ¡INSTALACIÓN EXITOSA! 🎉🎉🎉');
        console.log('==================================================');
        console.log('🔑 NUEVO TOKEN:');
        console.log(json.access_token);
        console.log('==================================================');
        console.log('✅ Token guardado en .env y en memoria');
        console.log('🏪 Store ID:', storeId);
        console.log('==================================================\n\n');
        
        return res.send(`
            <html>
            <head>
                <style>
                    body { font-family: Arial; padding: 50px; text-align: center; background: #f0f0f0; }
                    .success { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
                    h1 { color: #00c853; }
                    code { background: #f5f5f5; padding: 10px; display: block; margin: 20px 0; border-radius: 5px; word-break: break-all; }
                </style>
            </head>
            <body>
                <div class="success">
                    <h1>✅ ¡Instalación Exitosa!</h1>
                    <p>La aplicación se ha instalado correctamente en tu tienda.</p>
                    <p><strong>Store ID:</strong> ${storeId}</p>
                    <p>El token se guardó automáticamente. Puedes cerrar esta ventana.</p>
                    <hr>
                    <p style="font-size: 12px; color: #666;">Token guardado en .env y consola de VS Code</p>
                </div>
            </body>
            </html>
        `);
    } else {
        console.error('Error Auth:', json);
        return res.send('Error obteniendo token: ' + JSON.stringify(json));
    }

  } catch (error) {
    console.error('Error en callback:', error);
    return res.status(500).send('Error interno');
  }
});