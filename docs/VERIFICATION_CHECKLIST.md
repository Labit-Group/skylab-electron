# ✅ Checklist de Verificación Local - Build macOS Apple Silicon

## 🏁 INICIO: Preparación del Entorno

### 1. Verificar Versiones Instaladas
```bash
# Node.js (debe ser 18+ o 20+)
node --version

# npm
npm --version

# Electron (debe coincidir con package.json)
npx electron --version

# Verificar que estás en un Mac
uname -m
# Resultado esperado en M1/M2: arm64
# Resultado en Intel: x86_64
```

---

## 🔨 PASO 1: Compilar Build Local arm64/universal

### Opción A: Build Universal (Recomendado)
```bash
# 1. Limpiar builds anteriores
rm -rf release-builds node_modules/.cache

# 2. Instalar dependencias limpias
npm ci

# 3. Recompilar módulos nativos para ambas arquitecturas
npm run rebuild:x64
npm run rebuild:arm64

# 4. Generar build universal
npm run build:mac:universal

# 5. Verificar que se generó el .app
ls -lh release-builds/mac-universal/
```

### Opción B: Build solo arm64
```bash
# 1. Limpiar
rm -rf release-builds node_modules/.cache

# 2. Instalar
npm ci

# 3. Rebuild para arm64
npm run rebuild:arm64

# 4. Build arm64
npm run build:mac:arm64

# 5. Verificar
ls -lh release-builds/mac-arm64/
```

### Opción C: Build solo x64 (Intel)
```bash
rm -rf release-builds node_modules/.cache
npm ci
npm run rebuild:x64
npm run build:mac:x64
ls -lh release-builds/mac/
```

---

## 🔍 PASO 2: Verificar Arquitectura del Binario

### Universal Build
```bash
# Localizar el ejecutable principal
APP_PATH="release-builds/mac-universal/SkyLab.app/Contents/MacOS/SkyLab"

# Verificar tipo de archivo
file "$APP_PATH"
# Resultado esperado: "Mach-O universal binary with 2 architectures: [x86_64:Mach-O 64-bit executable x86_64] [arm64:Mach-O 64-bit executable arm64]"

# Verificar arquitecturas con lipo
lipo -info "$APP_PATH"
# Resultado esperado: "Architectures in the fat file: ... are: x86_64 arm64"

# Ver detalles de cada arquitectura
lipo -detailed_info "$APP_PATH"
```

### arm64 Build
```bash
APP_PATH="release-builds/mac-arm64/SkyLab.app/Contents/MacOS/SkyLab"

file "$APP_PATH"
# Resultado esperado: "Mach-O 64-bit executable arm64"

lipo -info "$APP_PATH"
# Resultado esperado: "Non-fat file: ... is architecture: arm64"
```

### x64 Build
```bash
APP_PATH="release-builds/mac/SkyLab.app/Contents/MacOS/SkyLab"

file "$APP_PATH"
# Resultado esperado: "Mach-O 64-bit executable x86_64"

lipo -info "$APP_PATH"
# Resultado esperado: "Non-fat file: ... is architecture: x86_64"
```

---

## 🔬 PASO 3: Verificar Módulos Nativos Recompilados

### Verificar electron-store (módulo nativo)
```bash
# Buscar binarios nativos de electron-store
find node_modules/electron-store -name "*.node" -type f

# Si existe, verificar su arquitectura
NATIVE_MODULE=$(find node_modules/electron-store -name "*.node" -type f | head -n 1)
if [ -f "$NATIVE_MODULE" ]; then
  file "$NATIVE_MODULE"
  lipo -info "$NATIVE_MODULE"
fi

# También buscar en otros posibles módulos nativos
find node_modules -name "*.node" -type f -exec sh -c 'echo "=== {} ==="; file "{}"; lipo -info "{}"' \;
```

### Verificar dependencias del bundle
```bash
# Listar todas las librerías dinámicas que usa el ejecutable
APP_PATH="release-builds/mac-universal/SkyLab.app/Contents/MacOS/SkyLab"

otool -L "$APP_PATH" | grep -v "System\|usr/lib"
# Debe mostrar principalmente frameworks de Electron
```

---

## 🚀 PASO 4: Ejecutar y Probar la App

### Ejecutar desde Terminal
```bash
# Ejecutar la app (para ver logs de consola)
open -a "release-builds/mac-universal/SkyLab.app"

# O ejecutar directamente el binario
./release-builds/mac-universal/SkyLab.app/Contents/MacOS/SkyLab

# Observar la consola para errores de carga de módulos nativos
```

### Verificar en Activity Monitor
```bash
# 1. Abrir Activity Monitor (Monitor de Actividad)
open -a "Activity Monitor"

# 2. Buscar el proceso "SkyLab"

# 3. Verificar la columna "Kind" (Tipo):
#    - "Apple" = ejecutándose nativamente en Apple Silicon ✅
#    - "Intel" = ejecutándose bajo Rosetta 2 ❌

# 4. Doble clic en el proceso → pestaña "Information"
#    - "Architecture" debe mostrar "ARM64" o "Universal"
```

### Verificar arquitectura del proceso en ejecución
```bash
# Mientras la app está corriendo
ps aux | grep SkyLab | grep -v grep

# Ver arquitectura del proceso
lsappinfo info -only pid -app SkyLab | awk '{print $3}' | xargs ps -p | grep -v PID

# Método alternativo: usar sysctl
PID=$(pgrep -f "SkyLab")
sysctl -n sysctl.proc_translated.$PID
# Resultado: 0 = nativo arm64 ✅
# Resultado: 1 = Rosetta 2 (Intel traducido) ❌
```

---

## ⚡ PASO 5: Tests de Rendimiento y Funcionalidad

### 1. Test de Arranque
```bash
# Medir tiempo de arranque
time open -a "release-builds/mac-universal/SkyLab.app"

# Cerrar y repetir 3 veces para promediar
```

### 2. Test de Funcionalidad Básica
- [ ] La app se inicia sin errores
- [ ] La ventana principal carga correctamente
- [ ] Puedes navegar dentro de la app
- [ ] Las descargas funcionan (botón de descarga)
- [ ] La ventana de progreso de descarga aparece
- [ ] Los menús contextuales funcionan
- [ ] Los atajos de teclado funcionan (Zoom: Cmd+Alt+Up/Down)
- [ ] La app se cierra correctamente

### 3. Test de electron-store (persistencia)
```bash
# Ejecutar la app, cambiar zoom, cerrar
# Reabrir - el nivel de zoom debe persistir

# Verificar el archivo de configuración de electron-store
ls -la ~/Library/Application\ Support/skylab/

# Debe existir un archivo config.json con las preferencias
cat ~/Library/Application\ Support/skylab/config.json
```

### 4. Monitoreo de Recursos
```bash
# Instalar Powermetrics (si no está disponible usa Activity Monitor)
sudo powermetrics --samplers cpu_power,gpu_power -i 1000 -n 30 > power_metrics.txt &

# Ejecutar la app durante 30 segundos
open -a "release-builds/mac-universal/SkyLab.app"

# Analizar resultados
grep -A 5 "SkyLab" power_metrics.txt

# Verificar CPU Usage (debe ser bajo en idle)
# Verificar GPU Activity (debe activarse si usas aceleración de hardware)
```

---

## 🔐 PASO 6: Verificar Firma y Notarización (Si Aplicable)

### Verificar si está firmado
```bash
APP_PATH="release-builds/mac-universal/SkyLab.app"

# Verificar firma
codesign --verify --deep --strict --verbose=2 "$APP_PATH"

# Ver información del certificado (si está firmado)
codesign -dvv "$APP_PATH" 2>&1 | grep -E "Authority|TeamIdentifier|Identifier"

# Ver entitlements
codesign -d --entitlements - "$APP_PATH"
```

### Verificar Gatekeeper
```bash
# Verificar que Gatekeeper aceptará la app
spctl --assess --verbose=4 --type execute "$APP_PATH"

# Resultados posibles:
# - "accepted" + "source=Apple System" = Firmado por Apple
# - "accepted" + "source=Notarized Developer ID" = Firmado + Notarizado ✅
# - "accepted" + "source=Developer ID" = Solo firmado (sin notarizar)
# - "rejected" = No firmado o firma inválida ❌
```

### Simular Descarga de Internet
```bash
# Agregar atributo de cuarentena (simula descarga)
xattr -w com.apple.quarantine "0000;00000000;Chrome;" \
  "release-builds/mac-universal/SkyLab.app"

# Intentar abrir
open "release-builds/mac-universal/SkyLab.app"

# Si NO está notarizado, aparecerá:
# "SkyLab.app no se puede abrir porque proviene de un desarrollador no identificado"

# Si ESTÁ notarizado, se abrirá sin problemas ✅

# Limpiar atributo de cuarentena después del test
xattr -cr "release-builds/mac-universal/SkyLab.app"
```

---

## 📦 PASO 7: Verificar DMG (Si se Generó)

```bash
# Verificar que el DMG existe
ls -lh release-builds/*.dmg

# Verificar firma del DMG
codesign --verify --deep --strict --verbose=2 \
  "release-builds/SkyLab-0.1.1-universal.dmg"

# Verificar notarización del DMG (si aplicable)
xcrun stapler validate "release-builds/SkyLab-0.1.1-universal.dmg"

# Montar DMG y verificar contenido
hdiutil attach "release-builds/SkyLab-0.1.1-universal.dmg"
ls -la /Volumes/SkyLab/
hdiutil detach /Volumes/SkyLab/
```

---

## 🐛 PASO 8: Troubleshooting - Errores Comunes

### Error: "A JavaScript error occurred in the main process"
```bash
# Causa: Módulos nativos no recompilados para la arquitectura correcta
# Solución:
rm -rf node_modules
npm ci
npm run rebuild:arm64  # o rebuild:x64
npm run build:mac:arm64
```

### Error: "Module did not self-register"
```bash
# Causa: electron-store u otro módulo nativo compilado para la arch incorrecta
# Solución:
npx electron-rebuild -f -w electron-store --arch=arm64

# Verificar que se recompiló
find node_modules/electron-store -name "*.node"
```

### App ejecutándose en Rosetta (Kind: Intel)
```bash
# Verificar arquitectura del binario
lipo -info release-builds/mac-universal/SkyLab.app/Contents/MacOS/SkyLab

# Si muestra solo x86_64, recompilar:
npm run build:mac:arm64
# o
npm run build:mac:universal
```

### "The application SkyLab can't be opened"
```bash
# Verificar permisos
chmod +x release-builds/mac-universal/SkyLab.app/Contents/MacOS/SkyLab

# Verificar integridad del bundle
codesign --verify --deep --strict "$APP_PATH"

# Si falla, recompilar desde cero
rm -rf release-builds node_modules
npm ci
npm run build:mac:universal
```

---

## 📊 PASO 9: Benchmark de Rendimiento (Opcional)

### CPU Benchmark
```bash
# Ejecutar la app y medir CPU durante carga inicial
sudo powermetrics --samplers cpu_power -i 100 -n 100 | grep -A 10 "SkyLab"
```

### Memory Footprint
```bash
# Ver uso de memoria
ps aux | grep SkyLab | awk '{print $4, $6, $11}'
# Columnas: %MEM, RSS (KB), COMMAND

# Monitoreo continuo
watch -n 1 "ps aux | grep SkyLab | grep -v grep"
```

### GPU Acceleration Check
```bash
# Ver si usa GPU (Metal API)
sudo powermetrics --samplers gpu_power -i 1000 -n 10 | grep -A 5 "SkyLab"

# Verificar en Activity Monitor → GPU History
# Debe mostrar actividad si usas webviews con contenido multimedia
```

---

## ✅ CHECKLIST FINAL

### Pre-Build
- [ ] `npm ci` ejecutado sin errores
- [ ] `npm run rebuild:arm64` (o arquitectura correspondiente) ejecutado
- [ ] Versiones de Node y Electron compatibles

### Build
- [ ] Build completado sin errores: `npm run build:mac:universal`
- [ ] Archivo `.app` generado en `release-builds/`
- [ ] DMG/ZIP generados (si configurado)

### Verificación de Arquitectura
- [ ] `file` muestra "universal binary" o "arm64"
- [ ] `lipo -info` muestra "x86_64 arm64" (universal) o "arm64"
- [ ] Módulos nativos verificados con arquitectura correcta

### Ejecución
- [ ] App se abre sin errores
- [ ] Activity Monitor muestra "Kind: Apple" (no Intel)
- [ ] `sysctl.proc_translated` devuelve `0`
- [ ] Funcionalidades principales funcionan (descarga, zoom, menús)
- [ ] Persistencia de configuración funciona (electron-store)

### Firma y Notarización (si aplicable)
- [ ] `codesign --verify` pasa sin errores
- [ ] `spctl --assess` muestra "accepted"
- [ ] Test con atributo de cuarentena pasa sin advertencias

### Rendimiento
- [ ] Tiempo de arranque < 3 segundos
- [ ] Uso de CPU en idle < 5%
- [ ] Uso de memoria razonable (~200-400 MB típico para Electron)

---

## 🎯 Comandos Rápidos (Copiar y Pegar)

```bash
# === BUILD COMPLETO UNIVERSAL ===
rm -rf release-builds node_modules/.cache && \
npm ci && \
npm run rebuild:x64 && \
npm run rebuild:arm64 && \
npm run build:mac:universal

# === VERIFICACIÓN RÁPIDA ===
APP_PATH="release-builds/mac-universal/SkyLab.app/Contents/MacOS/SkyLab"
echo "=== Tipo de archivo ===" && file "$APP_PATH"
echo "=== Arquitecturas ===" && lipo -info "$APP_PATH"
echo "=== Módulos nativos ===" && find node_modules -name "*.node" -type f | head -5

# === EJECUTAR Y VERIFICAR ===
open -a "release-builds/mac-universal/SkyLab.app" && \
sleep 3 && \
PID=$(pgrep -f "SkyLab") && \
echo "PID: $PID" && \
echo "Ejecutándose bajo Rosetta? $(sysctl -n sysctl.proc_translated.$PID 2>/dev/null || echo 'N/A')" && \
echo "0 = nativo ARM64 ✅ | 1 = Rosetta (Intel) ❌"

# === VERIFICAR FIRMA ===
codesign --verify --deep --strict --verbose=2 \
  "release-builds/mac-universal/SkyLab.app" && \
spctl --assess --verbose=4 --type execute \
  "release-builds/mac-universal/SkyLab.app"
```

---

## 📞 Contacto/Debug

Si encuentras problemas:
1. Revisa los logs de build en la consola
2. Ejecuta la app desde terminal para ver errores de runtime
3. Revisa `release-builds/builder-debug.yml`
4. Consulta la documentación completa en `docs/CODESIGN_NOTARIZE.md`

---

¡Checklist completado! Tu build de SkyLab para Apple Silicon está listo. 🚀
