# 🍎 Guía de Firma Digital y Notarización para macOS

## 📋 Requisitos Previos

### 1. Apple Developer Account
- Cuenta de desarrollador Apple activa ($99/año)
- Acceso a https://developer.apple.com

### 2. Certificado de Firma
Necesitas un certificado **"Developer ID Application"** (no confundir con "Mac App Store")

#### Pasos para obtenerlo:
1. Ve a https://developer.apple.com/account/resources/certificates/list
2. Click en el botón "+" para crear un nuevo certificado
3. Selecciona **"Developer ID Application"**
4. Sigue las instrucciones para generar un CSR (Certificate Signing Request)
5. Descarga el certificado `.cer` y agrégalo a tu Keychain

### 3. Credenciales para Notarización

Tienes **2 opciones**:

#### Opción A: App-Specific Password (Recomendado para CI/CD)
```bash
# 1. Ve a https://appleid.apple.com/account/manage
# 2. En "Sign-In and Security" → "App-Specific Passwords"
# 3. Genera una nueva contraseña
# 4. Guarda la contraseña generada (no la podrás ver de nuevo)
```

#### Opción B: API Key (Método más moderno)
```bash
# 1. Ve a https://appstoreconnect.apple.com/access/api
# 2. En "Keys" → Click "+"
# 3. Nombre: "SkyLab Notarization"
# 4. Acceso: "Developer" (suficiente para notarización)
# 5. Descarga el archivo .p8 (solo se puede descargar una vez)
# 6. Anota el Key ID y Issuer ID
```

---

## 🔐 Configuración Local (para desarrollo)

### 1. Exportar Certificado desde Keychain

```bash
# Abre Keychain Access
# Busca tu certificado "Developer ID Application: Tu Nombre"
# Click derecho → Export "Developer ID Application..."
# Guarda como certificate.p12
# Usa una contraseña fuerte y anótala

# Convertir a base64 para GitHub Secrets:
base64 -i certificate.p12 -o certificate-base64.txt
```

### 2. Configurar Variables de Entorno Locales

Crea un archivo `.env.local` (NO lo subas a Git):

```bash
# === USANDO APP-SPECIFIC PASSWORD ===
export APPLE_ID="tu-email@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="XXXXXXXXXX"  # Encuentra en developer.apple.com → Membership
export CSC_LINK="/path/to/certificate.p12"
export CSC_KEY_PASSWORD="tu-password-del-p12"

# === O USANDO API KEY ===
# export APPLE_API_KEY="/path/to/AuthKey_XXXXXXXXXX.p8"
# export APPLE_API_KEY_ID="XXXXXXXXXX"
# export APPLE_API_ISSUER="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
# export APPLE_TEAM_ID="XXXXXXXXXX"
# export CSC_LINK="/path/to/certificate.p12"
# export CSC_KEY_PASSWORD="tu-password-del-p12"
```

Luego carga las variables:
```bash
source .env.local
```

### 3. Actualizar `package.json` con Configuración de Notarización

Ya está incluido en tu `package.json` actualizado, pero aquí los detalles:

```json
{
  "build": {
    "mac": {
      "hardenedRuntime": true,
      "gatekeeperAssess": false,
      "entitlements": "build/entitlements.mac.plist",
      "entitlementsInherit": "build/entitlements.mac.plist"
    },
    "afterSign": "scripts/notarize.js"  // Opcional: script personalizado
  }
}
```

---

## 🚀 Firma y Notarización Automática con electron-builder

### Opción 1: Configuración Integrada (Recomendado)

Con las variables de entorno configuradas, electron-builder lo hace automáticamente:

```bash
# Cargar variables
source .env.local

# Build + Firma + Notarización automática
npm run build:mac:universal
```

electron-builder detectará las variables y:
1. ✅ Firmará la app con tu certificado
2. ✅ Enviará a Apple para notarización
3. ✅ Esperará la aprobación (~2-10 minutos)
4. ✅ Hará "stapling" del ticket de notarización

### Opción 2: Script Personalizado de Notarización

Crea `scripts/notarize.js`:

```javascript
const { notarize } = require('@electron/notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  
  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = `${appOutDir}/${appName}.app`;

  console.log(`🔐 Notarizando ${appPath}...`);

  // Opción A: Con App-Specific Password
  await notarize({
    appPath: appPath,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  });

  /* Opción B: Con API Key
  await notarize({
    appPath: appPath,
    appleApiKey: process.env.APPLE_API_KEY_ID,
    appleApiKeyPath: process.env.APPLE_API_KEY,
    appleApiIssuer: process.env.APPLE_API_ISSUER,
    teamId: process.env.APPLE_TEAM_ID,
  });
  */

  console.log('✅ Notarización completada');
};
```

Instala la dependencia:
```bash
npm install --save-dev @electron/notarize
```

---

## 🔧 Firma y Notarización Manual

### 1. Firmar Aplicación

```bash
# Después de compilar sin firmar
codesign --deep --force --verify --verbose \
  --sign "Developer ID Application: Tu Nombre (TEAM_ID)" \
  --options runtime \
  --entitlements build/entitlements.mac.plist \
  "release-builds/mac-universal/SkyLab.app"

# Verificar firma
codesign --verify --deep --strict --verbose=2 \
  "release-builds/mac-universal/SkyLab.app"

# Ver detalles de la firma
codesign -dv --verbose=4 \
  "release-builds/mac-universal/SkyLab.app"
```

### 2. Crear DMG Firmado

```bash
# Si usas electron-builder, el DMG ya estará creado y firmado
# Para firmar manualmente un DMG:
codesign --sign "Developer ID Application: Tu Nombre (TEAM_ID)" \
  "release-builds/SkyLab-0.1.1-universal.dmg"
```

### 3. Notarizar con Apple

#### Usando App-Specific Password:
```bash
xcrun notarytool submit "release-builds/SkyLab-0.1.1-universal.dmg" \
  --apple-id "tu-email@example.com" \
  --password "xxxx-xxxx-xxxx-xxxx" \
  --team-id "XXXXXXXXXX" \
  --wait

# Ver el historial de notarizaciones
xcrun notarytool history \
  --apple-id "tu-email@example.com" \
  --password "xxxx-xxxx-xxxx-xxxx" \
  --team-id "XXXXXXXXXX"

# Ver detalles de una notarización específica
xcrun notarytool log <SUBMISSION_ID> \
  --apple-id "tu-email@example.com" \
  --password "xxxx-xxxx-xxxx-xxxx" \
  --team-id "XXXXXXXXXX"
```

#### Usando API Key:
```bash
xcrun notarytool submit "release-builds/SkyLab-0.1.1-universal.dmg" \
  --key "/path/to/AuthKey_XXXXXXXXXX.p8" \
  --key-id "XXXXXXXXXX" \
  --issuer "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" \
  --wait
```

### 4. Stapling (Adjuntar el Ticket)

```bash
# Una vez aprobada la notarización, adjunta el ticket:
xcrun stapler staple "release-builds/SkyLab-0.1.1-universal.dmg"

# Verificar que el stapling fue exitoso
xcrun stapler validate "release-builds/SkyLab-0.1.1-universal.dmg"
```

---

## 🎯 GitHub Actions: Configurar Secrets

Ve a tu repositorio → Settings → Secrets and variables → Actions → New repository secret

### Secrets Requeridos:

#### Con App-Specific Password:
```
MAC_CERTIFICATE_BASE64          # Contenido de certificate-base64.txt
MAC_CERTIFICATE_PASSWORD        # Password del .p12
APPLE_ID                        # tu-email@example.com
APPLE_APP_SPECIFIC_PASSWORD     # xxxx-xxxx-xxxx-xxxx
APPLE_TEAM_ID                   # XXXXXXXXXX
```

#### Con API Key:
```
MAC_CERTIFICATE_BASE64          # Contenido de certificate-base64.txt
MAC_CERTIFICATE_PASSWORD        # Password del .p12
APPLE_API_KEY                   # Contenido del .p8 en base64
APPLE_API_KEY_ID                # XXXXXXXXXX
APPLE_API_ISSUER                # xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
APPLE_TEAM_ID                   # XXXXXXXXXX
```

---

## ✅ Verificación Post-Firma

### 1. Verificar Firma Digital

```bash
# Verificar que la app está firmada
codesign --verify --deep --strict --verbose=2 \
  "release-builds/mac-universal/SkyLab.app"

# Ver información del certificado
codesign -dvv "release-builds/mac-universal/SkyLab.app" 2>&1 | grep -E "Authority|TeamIdentifier|Identifier"

# Verificar entitlements
codesign -d --entitlements - "release-builds/mac-universal/SkyLab.app"
```

### 2. Verificar Notarización

```bash
# Verificar que el stapling fue exitoso
xcrun stapler validate "release-builds/SkyLab-0.1.1-universal.dmg"

# Verificar que Gatekeeper aceptará la app
spctl --assess --verbose=4 --type execute \
  "release-builds/mac-universal/SkyLab.app"

# Resultado esperado: "source=Notarized Developer ID"
```

### 3. Probar en un Mac Limpio

```bash
# Simular descarga desde internet
xattr -w com.apple.quarantine "0000;00000000;Chrome;" \
  "SkyLab-0.1.1-universal.dmg"

# Montar DMG y ejecutar
open "SkyLab-0.1.1-universal.dmg"
# Arrastrar a Applications
# Ejecutar - NO debería aparecer advertencia de "desarrollador no verificado"
```

---

## 🐛 Problemas Comunes

### Error: "No valid signing identity found"
```bash
# Solución: Importar certificado a Keychain
security import certificate.p12 -k ~/Library/Keychains/login.keychain-db

# Ver certificados disponibles
security find-identity -v -p codesigning
```

### Error: "The app is damaged and can't be opened"
```bash
# Causa: Firma incorrecta o notarización fallida
# Solución: Recompilar, firmar y notarizar de nuevo

# Limpiar atributos de cuarentena (solo para pruebas locales)
xattr -cr /Applications/SkyLab.app
```

### Error: Notarización rechazada
```bash
# Ver los logs de notarización
xcrun notarytool log <SUBMISSION_ID> \
  --apple-id "tu-email@example.com" \
  --password "xxxx-xxxx-xxxx-xxxx" \
  --team-id "XXXXXXXXXX"

# Errores comunes:
# - Falta de hardened runtime → Verificar entitlements
# - Librerías sin firmar → Usar --deep en codesign
# - Entitlements incorrectos → Revisar entitlements.mac.plist
```

### Notarización tarda mucho (>1 hora)
```bash
# Apple puede tardar de 2-15 minutos normalmente
# Si tarda más:
# 1. Verificar status manualmente
xcrun notarytool history --apple-id "..." --password "..." --team-id "..."

# 2. Si está "In Progress" por >30 min, puede haber un problema del lado de Apple
# 3. Cancelar y reenviar si es necesario
```

---

## 📚 Referencias

- [electron-builder Code Signing](https://www.electron.build/code-signing)
- [Apple Notarization Guide](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [@electron/notarize](https://github.com/electron/notarize)
- [notarytool Documentation](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution/customizing_the_notarization_workflow)

---

## 🎓 Notas Importantes

1. **Hardened Runtime es OBLIGATORIO** para notarización desde macOS 10.14+
2. **Los entitlements deben ser mínimos** pero suficientes (ya configurados en `entitlements.mac.plist`)
3. **Gatekeeper solo verifica apps descargadas de internet** (con atributo de cuarentena)
4. **El stapling es opcional pero RECOMENDADO** - permite que la app funcione offline
5. **La notarización no caduca**, pero el certificado sí (renovar anualmente)
6. **Para App Store**, necesitas un certificado diferente: "Mac App Store Distribution"

---

¡Ya estás listo para firmar y notarizar SkyLab! 🚀
