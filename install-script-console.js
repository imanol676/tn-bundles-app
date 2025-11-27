// ============================================
// INSTALADOR DE SCRIPT - TN BUNDLES
// ============================================
// Copia y pega este código en la consola del navegador
// cuando estés en cualquier página de tu tienda
// ============================================

(async function() {
    const STORE_ID = 6973970;
    const TOKEN = '4ae9116317598bd89083a3bd755ef6059652e7a48a3f1da1';
    const WIDGET_URL = 'https://tn-bundles-af9iu731q-imanolkremis505-4614s-projects.vercel.app/widget.js';
    
    console.log('🚀 Iniciando instalación del script...');
    
    try {
        // 1. Verificar scripts existentes
        console.log('📋 Verificando scripts instalados...');
        const checkResponse = await fetch(`https://api.tiendanube.com/v1/${STORE_ID}/scripts`, {
            headers: {
                'Authentication': `bearer ${TOKEN}`,
                'User-Agent': 'TN Bundles Installer'
            }
        });
        
        const scripts = await checkResponse.json();
        console.log(`📊 Scripts encontrados: ${scripts.length}`);
        
        // 2. Eliminar scripts antiguos de bundles
        const bundleScripts = scripts.filter(s => s.src && s.src.includes('widget.js'));
        
        if (bundleScripts.length > 0) {
            console.log(`🗑️ Eliminando ${bundleScripts.length} script(s) antiguo(s)...`);
            for (const script of bundleScripts) {
                await fetch(`https://api.tiendanube.com/v1/${STORE_ID}/scripts/${script.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authentication': `bearer ${TOKEN}`,
                        'User-Agent': 'TN Bundles Installer'
                    }
                });
                console.log(`✅ Script ${script.id} eliminado`);
            }
        }
        
        // 3. Instalar nuevo script
        console.log('📦 Instalando nuevo script...');
        const installResponse = await fetch(`https://api.tiendanube.com/v1/${STORE_ID}/scripts`, {
            method: 'POST',
            headers: {
                'Authentication': `bearer ${TOKEN}`,
                'User-Agent': 'TN Bundles Installer',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                src: WIDGET_URL,
                event: 'onfirstinteraction',
                where: 'store'
            })
        });
        
        if (!installResponse.ok) {
            const error = await installResponse.text();
            console.error('❌ Error instalando:', error);
            return;
        }
        
        const result = await installResponse.json();
        console.log('✅ ¡Script instalado correctamente!');
        console.log('📝 Detalles:', result);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎉 INSTALACIÓN COMPLETA');
        console.log(`📍 Script ID: ${result.id}`);
        console.log(`🔗 URL: ${result.src}`);
        console.log(`⚡ Event: ${result.event}`);
        console.log(`📌 Where: ${result.where}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
        console.log('✨ Ahora ve a una página de producto y haz scroll o click');
        console.log('   El widget debería aparecer cuando interactúes con la página');
        console.log('');
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
})();
