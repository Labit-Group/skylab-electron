# 🍎 SkyLab - Configuración para Builds macOS Apple Silicon

## 📋 Resumen Ejecutivo

Este proyecto ha sido configurado para generar builds nativos de **SkyLab** para macOS, optimizados tanto para **Apple Silicon (arm64)** como para **Intel (x64)**, así como builds **universales** que funcionan en ambas arquitecturas.

### ✅ Lo que se ha configurado:

1. ✅ **package.json** actualizado con:
   - Scripts para builds por arquitectura (`build:mac:x64`, `build:mac:arm64`, `build:mac:universal`)
   - Configuración de electron-builder para builds universales
   - electron-rebuild para recompilar módulos nativos
   - Entitlements para macOS (firma digital)

2. ✅ **GitHub Actions CI/CD** (`.github/workflows/build-mac.yml`):
   - Jobs separados para x64 e arm64
   - Job para build universal
   - Configuración para firma digital y notarización
   - Artefactos automáticos

3. ✅ **Documentación completa**:
   - `docs/CODESIGN_NOTARIZE.md` - Guía de firma y notarización
   - `docs/VERIFICATION_CHECKLIST.md` - Checklist de verificación local
   - Este README

---

## 🚀 Inicio Rápido - Compilar Localmente

### Opción 1: Build Universal (Recomendado)

```bash
# 1. Instalar dependencias
npm install

# 2. Recompilar módulos nativos
npm run rebuild:arm64  # Si estás en Apple Silicon
npm run rebuild:x64    # Si estás en Intel Mac

# 3. Generar build universal
npm run build:mac:universal
```

El resultado estará en: `release-builds/mac-universal/SkyLab.app`

### Opción 2: Build Específico por Arquitectura

```bash
# Para Apple Silicon (M1/M2/M3)
npm install
npm run rebuild:arm64
npm run build:mac:arm64

# Para Intel
npm install
npm run rebuild:x64
npm run build:mac:x64
```

---

## 📦 Scripts Disponibles

```json
{
  "start": "electron .",                           // Ejecutar en modo desarrollo
  "dist": "electron-builder",                      // Build por defecto
  "dist:win": "electron-builder --win",            // Build Windows
  "dist:mac": "electron-builder --mac",            // Build macOS (arquitectura del sistema)
  "dist:linux": "electron-builder --linux",        // Build Linux
  "build:mac:x64": "electron-builder --mac --x64", // Build macOS Intel
  "build:mac:arm64": "electron-builder --mac --arm64", // Build macOS Apple Silicon
  "build:mac:universal": "electron-builder --mac --universal", // Build Universal
  "rebuild:x64": "electron-rebuild --arch=x64",    // Recompilar módulos nativos x64
  "rebuild:arm64": "electron-rebuild --arch=arm64" // Recompilar módulos nativos arm64
}
```

---

## 🔍 Verificar Arquitectura del Build

### Después de compilar, verifica que el build es correcto:

```bash
# Verificar tipo de archivo
file release-builds/mac-universal/SkyLab.app/Contents/MacOS/SkyLab

# Verificar arquitecturas incluidas
lipo -info release-builds/mac-universal/SkyLab.app/Contents/MacOS/SkyLab

# Resultado esperado para universal:
# "Architectures in the fat file: ... are: x86_64 arm64"
```

### Verificar que se ejecuta nativamente en Apple Silicon:

```bash
# 1. Ejecutar la app
open release-builds/mac-universal/SkyLab.app

# 2. Obtener el PID
PID=$(pgrep -f "SkyLab")

# 3. Verificar si usa Rosetta
sysctl -n sysctl.proc_translated.$PID
# Resultado: 0 = nativo ✅ | 1 = Rosetta ❌
```

---

## 🛠️ Información Técnica

### Dependencias Nativas Detectadas

- **electron-store** (v8.1.0): Usa módulos nativos - **requiere recompilación**
- **electron-context-menu** (v3.6.1): JavaScript puro - no requiere recompilación

### Versiones

- **Electron**: ^35.7.5 (última versión)
- **Node.js**: Requiere 18+ o 20+
- **electron-builder**: ^24.13.1
- **electron-rebuild**: ^3.2.9

### Arquitecturas Soportadas

| Build | Plataforma | Tamaño | Compatibilidad |
|-------|------------|--------|----------------|
| **x64** | macOS Intel | ~150MB | Solo Intel + Rosetta en M1/M2 |
| **arm64** | macOS Apple Silicon | ~140MB | Solo M1/M2/M3 |
| **universal** | macOS Todos | ~280MB | Intel + Apple Silicon nativamente |

---

## 🔐 Firma Digital y Notarización

### Requisitos:

1. **Apple Developer Account** ($99/año)
2. **Certificado "Developer ID Application"**
3. **App-Specific Password o API Key** para notarización

### Guía Completa:

Consulta `docs/CODESIGN_NOTARIZE.md` para instrucciones detalladas sobre:
- Cómo obtener certificados
- Configurar credenciales
- Firmar localmente
- Notarizar con Apple
- Configurar GitHub Actions

### Configuración Rápida para Firma Local:

```bash
# Crear archivo .env.local (NO subirlo a Git)
export APPLE_ID="tu-email@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="XXXXXXXXXX"
export CSC_LINK="/path/to/certificate.p12"
export CSC_KEY_PASSWORD="tu-password"

# Cargar variables
source .env.local

# Build + Firma + Notarización automática
npm run build:mac:universal
```

---

## 🤖 CI/CD con GitHub Actions

### Configuración Automática

El workflow `.github/workflows/build-mac.yml` incluye:

1. **Job `build-macos-x64`**: Compila para Intel (runner `macos-13`)
2. **Job `build-macos-arm64`**: Compila para Apple Silicon (runner `macos-14`)
3. **Job `build-macos-universal`**: Compila build universal
4. **Artefactos**: Sube automáticamente los DMG/ZIP generados

### Secrets Requeridos en GitHub

Configura estos secrets en: **Settings → Secrets → Actions**

```
MAC_CERTIFICATE_BASE64          # Certificado p12 en base64
MAC_CERTIFICATE_PASSWORD        # Password del certificado
APPLE_ID                        # tu-email@example.com
APPLE_APP_SPECIFIC_PASSWORD     # Password generado en appleid.apple.com
APPLE_TEAM_ID                   # Team ID de developer.apple.com
```

### Activar Notarización en CI

Descomenta las líneas en `.github/workflows/build-mac.yml`:

```yaml
env:
  CSC_LINK: ${{ secrets.MAC_CERTIFICATE_BASE64 }}
  CSC_KEY_PASSWORD: ${{ secrets.MAC_CERTIFICATE_PASSWORD }}
  APPLE_ID: ${{ secrets.APPLE_ID }}
  APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
  APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
```

---

## ✅ Checklist de Verificación

Antes de distribuir, asegúrate de:

- [ ] El build se genera sin errores
- [ ] `lipo -info` muestra las arquitecturas correctas
- [ ] La app se ejecuta nativamente en M1/M2 (no bajo Rosetta)
- [ ] Las funcionalidades principales funcionan (descargas, zoom, menús)
- [ ] electron-store persiste configuración correctamente
- [ ] (Si firmado) `codesign --verify` pasa sin errores
- [ ] (Si notarizado) `spctl --assess` muestra "accepted"
- [ ] La app abre sin advertencias de seguridad en un Mac limpio

**Checklist completo**: Ver `docs/VERIFICATION_CHECKLIST.md`

---

## 🐛 Problemas Comunes

### Error: "Module did not self-register"
```bash
# Solución: Recompilar módulos nativos
rm -rf node_modules
npm install
npm run rebuild:arm64  # o rebuild:x64
npm run build:mac:arm64
```

### La app se ejecuta en Rosetta (Activity Monitor muestra "Intel")
```bash
# Verificar arquitectura del binario
lipo -info release-builds/mac-universal/SkyLab.app/Contents/MacOS/SkyLab

# Si solo muestra x86_64, recompilar
npm run build:mac:arm64
```

### Build universal falla
```bash
# Requiere compilar en macOS (no Linux/Windows)
# Requiere recompilar módulos nativos para ambas archs:
npm run rebuild:x64
npm run rebuild:arm64
npm run build:mac:universal
```

---

## 📚 Recursos Adicionales

### Documentación Completa

- **`docs/CODESIGN_NOTARIZE.md`**: Guía paso a paso de firma y notarización
- **`docs/VERIFICATION_CHECKLIST.md`**: Checklist detallado de verificación local
- **`build/entitlements.mac.plist`**: Permisos de la app (Hardened Runtime)

### Referencias Externas

- [Electron Documentation](https://www.electronjs.org/docs)
- [electron-builder Docs](https://www.electron.build)
- [Apple Notarization Guide](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [GitHub Actions - macOS Runners](https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners#supported-runners-and-hardware-resources)

---

## 🎯 Siguiente Pasos Recomendados

### Para Desarrollo Local:

1. ✅ Instalar dependencias: `npm install`
2. ✅ Compilar build de prueba: `npm run build:mac:arm64` (o universal)
3. ✅ Verificar con checklist: `docs/VERIFICATION_CHECKLIST.md`

### Para Distribución:

1. ⚙️ Obtener certificado Developer ID de Apple
2. ⚙️ Configurar credenciales (ver `docs/CODESIGN_NOTARIZE.md`)
3. ⚙️ Configurar GitHub Secrets
4. ⚙️ Activar notarización en workflow
5. 🚀 Push a main → Build automático + Notarización

---

## 📞 Soporte

Para problemas o preguntas:
1. Revisa `docs/VERIFICATION_CHECKLIST.md` para troubleshooting
2. Consulta los logs de build: `release-builds/builder-debug.yml`
3. Verifica la documentación de electron-builder

---

**Autor**: Francisco Ortega Iglesias  
**Proyecto**: SkyLab  
**Organización**: Labit Group  
**Versión actual**: 0.1.1

---

¡Tu aplicación SkyLab está lista para ejecutarse nativamente en Apple Silicon! 🚀
