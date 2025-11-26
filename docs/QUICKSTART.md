# ============================================
# 📋 CHECKLIST OPERATIVO - EJECUTAR AHORA
# ============================================

## ✅ PASO 1: Instalar Dependencias

```bash
cd /home/franorteg/Escritorio/Skylab/electron/electron-packer
npm install
```

**Esto instalará:**
- electron-rebuild (nuevo)
- Todas las dependencias existentes actualizadas

---

## ✅ PASO 2: Build Local de Prueba

### Opción A: Build Universal (Recomendado si tienes Mac)
```bash
# SOLO EN MACOS - Recompilar módulos nativos
npm run rebuild:x64
npm run rebuild:arm64

# Generar build universal
npm run build:mac:universal
```

### Opción B: Build específico (si solo tienes un tipo de Mac)
```bash
# En Apple Silicon (M1/M2/M3)
npm run rebuild:arm64
npm run build:mac:arm64

# En Intel Mac
npm run rebuild:x64
npm run build:mac:x64
```

**⚠️ IMPORTANTE**: Estás en **Linux**, así que NO podrás compilar para macOS localmente.  
Necesitarás usar **GitHub Actions** (ver Paso 4) o compilar en un Mac.

---

## ✅ PASO 3: Verificar Build (Solo si compilaste en macOS)

```bash
# Verificar arquitectura del binario
APP_PATH="release-builds/mac-universal/SkyLab.app/Contents/MacOS/SkyLab"
file "$APP_PATH"
lipo -info "$APP_PATH"

# Ejecutar la app
open -a "release-builds/mac-universal/SkyLab.app"

# Verificar que corre nativamente (no bajo Rosetta)
PID=$(pgrep -f "SkyLab")
sysctl -n sysctl.proc_translated.$PID
# Resultado: 0 = nativo ✅ | 1 = Rosetta ❌
```

---

## ✅ PASO 4: Configurar GitHub Actions (Compilación en la Nube)

### 4.1. Hacer Commit de los Cambios

```bash
cd /home/franorteg/Escritorio/Skylab/electron/electron-packer

# Agregar archivos modificados/nuevos
git add .

# Commit
git commit -m "feat: Add Apple Silicon (arm64) build support

- Configure electron-builder for universal/arm64/x64 builds
- Add electron-rebuild for native modules
- Add GitHub Actions workflow for multi-arch macOS builds
- Add codesign and notarization configuration
- Add comprehensive documentation for builds and verification"

# Push a GitHub
git push origin main
```

### 4.2. (Opcional) Configurar Secrets para Firma/Notarización

Si tienes certificado de Apple Developer:

1. Ve a: https://github.com/Labit-Group/skylab-electron/settings/secrets/actions
2. Agrega estos secrets (ver `docs/CODESIGN_NOTARIZE.md` para obtenerlos):
   - `MAC_CERTIFICATE_BASE64`
   - `MAC_CERTIFICATE_PASSWORD`
   - `APPLE_ID`
   - `APPLE_APP_SPECIFIC_PASSWORD`
   - `APPLE_TEAM_ID`

3. Descomenta las líneas de firma en `.github/workflows/build-mac.yml`

### 4.3. Ejecutar Workflow

El workflow se ejecutará automáticamente en cada push a `main`.  
O puedes ejecutarlo manualmente:

1. Ve a: https://github.com/Labit-Group/skylab-electron/actions
2. Selecciona "Build macOS (Multi-Architecture)"
3. Click en "Run workflow" → "Run workflow"

**Resultados:**
- Artefactos descargables con builds para x64, arm64 y universal
- Se ejecuta en runners de GitHub (macOS-13 para Intel, macOS-14 para Apple Silicon)

---

## ✅ PASO 5: Verificar Workflow en GitHub Actions

Después del push, verifica:

```bash
# Ver status del último workflow (requiere GitHub CLI)
gh run list --repo Labit-Group/skylab-electron

# Ver logs en tiempo real
gh run watch

# Descargar artefactos una vez completado
gh run download
```

O visita directamente: https://github.com/Labit-Group/skylab-electron/actions

---

## 📦 PASO 6: Descargar y Probar Build de CI

Una vez que el workflow termine:

1. Ve a la página del workflow en GitHub Actions
2. Descarga los artefactos:
   - `skylab-macos-x64` (Intel)
   - `skylab-macos-arm64` (Apple Silicon)
   - `skylab-macos-universal` (ambos)

3. En tu Mac, prueba el build:
   ```bash
   # Descomprimir artefacto
   unzip skylab-macos-universal.zip
   
   # Verificar arquitectura
   lipo -info SkyLab.app/Contents/MacOS/SkyLab
   
   # Ejecutar
   open SkyLab.app
   ```

---

## 🔐 PASO 7 (Opcional): Firma y Notarización

### Si NO tienes certificado Apple Developer:
- Los builds funcionarán pero mostrarán advertencia de seguridad
- Los usuarios deberán hacer clic derecho → Abrir (primera vez)

### Si TIENES certificado Apple Developer:
1. Lee `docs/CODESIGN_NOTARIZE.md`
2. Obtén tus credenciales
3. Configura los secrets en GitHub
4. Descomenta configuración de firma en workflow
5. El próximo build estará firmado y notarizado ✅

---

## 🎯 Comandos de un Vistazo (Copiar y Pegar)

```bash
# === EN LINUX (TU SISTEMA ACTUAL) ===
cd /home/franorteg/Escritorio/Skylab/electron/electron-packer
npm install
git add .
git commit -m "feat: Add Apple Silicon build support with CI/CD"
git push origin main

# === EN MACOS (para compilar localmente) ===
cd /ruta/a/electron-packer
npm install
npm run rebuild:arm64
npm run build:mac:universal

# Verificar
lipo -info release-builds/mac-universal/SkyLab.app/Contents/MacOS/SkyLab
open -a "release-builds/mac-universal/SkyLab.app"
```

---

## 📊 Resumen de Cambios Realizados

### Archivos Modificados:
- ✅ `package.json` - Scripts y configuración multi-arch
- ✅ `build/entitlements.mac.plist` - Permisos de macOS (creado)

### Archivos Creados:
- ✅ `.github/workflows/build-mac.yml` - CI/CD para macOS
- ✅ `docs/CODESIGN_NOTARIZE.md` - Guía de firma
- ✅ `docs/VERIFICATION_CHECKLIST.md` - Checklist de verificación
- ✅ `docs/README.md` - Índice de documentación
- ✅ `README_APPLE_SILICON.md` - Inicio rápido
- ✅ `QUICKSTART.md` - Este archivo

### Scripts Nuevos en package.json:
```json
"build:mac:x64": "electron-builder --mac --x64",
"build:mac:arm64": "electron-builder --mac --arm64",
"build:mac:universal": "electron-builder --mac --universal",
"rebuild:x64": "electron-rebuild --arch=x64",
"rebuild:arm64": "electron-rebuild --arch=arm64",
"postinstall": "electron-builder install-app-deps"
```

---

## 🚀 Próximos Pasos

1. **Ahora mismo**: Ejecutar `npm install` y hacer commit/push
2. **En GitHub**: Verificar que el workflow se ejecute correctamente
3. **En un Mac**: Descargar artefactos y probar builds
4. **Opcional**: Configurar firma y notarización para distribución

---

## 📞 Ayuda

- **Documentación completa**: Ver `docs/README.md`
- **Troubleshooting**: Ver `docs/VERIFICATION_CHECKLIST.md` (sección "Problemas Comunes")
- **Firma/Notarización**: Ver `docs/CODESIGN_NOTARIZE.md`

---

¡Listo para compilar SkyLab nativo para Apple Silicon! 🚀
