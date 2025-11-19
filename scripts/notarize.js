#!/usr/bin/env node

/**
 * Script de Notarización para SkyLab
 * 
 * Este script personalizado se ejecuta después de que electron-builder
 * firma la aplicación, enviándola a Apple para notarización.
 * 
 * Uso:
 *   1. Instalar dependencia: npm install --save-dev @electron/notarize
 *   2. Configurar package.json:
 *      "build": {
 *        "afterSign": "scripts/notarize.js"
 *      }
 *   3. Configurar variables de entorno (ver docs/CODESIGN_NOTARIZE.md)
 */

const { notarize } = require('@electron/notarize');
const path = require('path');

/**
 * Función principal de notarización
 * @param {Object} context - Contexto de electron-builder
 */
exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  
  // Solo ejecutar en macOS
  if (electronPlatformName !== 'darwin') {
    console.log('⏭️  Saltando notarización (no es macOS)');
    return;
  }

  // Verificar que las variables de entorno estén configuradas
  const appleId = process.env.APPLE_ID;
  const appleIdPassword = process.env.APPLE_APP_SPECIFIC_PASSWORD;
  const appleApiKey = process.env.APPLE_API_KEY_ID;
  const appleApiKeyPath = process.env.APPLE_API_KEY;
  const appleApiIssuer = process.env.APPLE_API_ISSUER;
  const teamId = process.env.APPLE_TEAM_ID;

  // Verificar que tengamos credenciales (password o API key)
  const hasPasswordAuth = appleId && appleIdPassword && teamId;
  const hasApiKeyAuth = appleApiKey && appleApiKeyPath && appleApiIssuer && teamId;

  if (!hasPasswordAuth && !hasApiKeyAuth) {
    console.log('⚠️  Saltando notarización: No hay credenciales configuradas');
    console.log('   Configura APPLE_ID + APPLE_APP_SPECIFIC_PASSWORD + APPLE_TEAM_ID');
    console.log('   o APPLE_API_KEY_ID + APPLE_API_KEY + APPLE_API_ISSUER + APPLE_TEAM_ID');
    console.log('   Ver docs/CODESIGN_NOTARIZE.md para más información');
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);

  console.log('');
  console.log('🔐 ════════════════════════════════════════════════════');
  console.log('🔐  Iniciando proceso de notarización');
  console.log('🔐 ════════════════════════════════════════════════════');
  console.log(`📦  Aplicación: ${appName}`);
  console.log(`📂  Ruta: ${appPath}`);
  console.log(`🏢  Team ID: ${teamId}`);
  
  if (hasPasswordAuth) {
    console.log(`🔑  Método: App-Specific Password`);
    console.log(`📧  Apple ID: ${appleId}`);
  } else {
    console.log(`🔑  Método: API Key`);
    console.log(`🔑  Key ID: ${appleApiKey}`);
  }
  
  console.log('🔐 ════════════════════════════════════════════════════');
  console.log('');

  try {
    // Configurar opciones de notarización
    let notarizeOptions = {
      appPath: appPath,
      teamId: teamId,
    };

    if (hasPasswordAuth) {
      // Autenticación con App-Specific Password
      notarizeOptions.appleId = appleId;
      notarizeOptions.appleIdPassword = appleIdPassword;
    } else {
      // Autenticación con API Key
      notarizeOptions.appleApiKey = appleApiKey;
      notarizeOptions.appleApiKeyPath = appleApiKeyPath;
      notarizeOptions.appleApiIssuer = appleApiIssuer;
    }

    console.log('⏳  Enviando aplicación a Apple...');
    console.log('   (Esto puede tomar de 2 a 10 minutos)');
    console.log('');

    // Ejecutar notarización
    await notarize(notarizeOptions);

    console.log('');
    console.log('✅ ════════════════════════════════════════════════════');
    console.log('✅  Notarización completada exitosamente!');
    console.log('✅ ════════════════════════════════════════════════════');
    console.log('');
    console.log('📝  Próximos pasos:');
    console.log('   1. El ticket de notarización ya está adjunto (stapled)');
    console.log('   2. La aplicación está lista para distribución');
    console.log('   3. Los usuarios podrán abrirla sin advertencias de seguridad');
    console.log('');
    console.log('🔍  Verificar notarización:');
    console.log(`   spctl --assess --verbose=4 --type execute "${appPath}"`);
    console.log('   Resultado esperado: "source=Notarized Developer ID"');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ ════════════════════════════════════════════════════');
    console.error('❌  Error durante la notarización');
    console.error('❌ ════════════════════════════════════════════════════');
    console.error('');
    console.error('💡  Posibles causas:');
    console.error('   • Credenciales incorrectas o expiradas');
    console.error('   • Certificado de firma inválido');
    console.error('   • Entitlements incorrectos');
    console.error('   • Problema del lado de Apple (servers)');
    console.error('');
    console.error('🔧  Soluciones:');
    console.error('   1. Verificar credenciales en .env.local');
    console.error('   2. Verificar firma: codesign --verify --deep "$appPath"');
    console.error('   3. Ver logs detallados en el error abajo');
    console.error('   4. Consultar docs/CODESIGN_NOTARIZE.md');
    console.error('');
    console.error('📋  Error completo:');
    console.error(error);
    console.error('');
    
    // Re-lanzar el error para que electron-builder lo maneje
    throw error;
  }
};

// Si se ejecuta directamente (para testing)
if (require.main === module) {
  console.log('ℹ️  Este script está diseñado para ser llamado por electron-builder');
  console.log('   Configura "afterSign": "scripts/notarize.js" en package.json');
  console.log('');
  console.log('   Para más información, ver: docs/CODESIGN_NOTARIZE.md');
  process.exit(0);
}
