# 🔧 Configuraciones Alternativas y Mejores Prácticas

## 📦 Configuraciones de electron-builder

### Opción 1: Build Universal (Configuración Actual - Recomendada)

```json
{
  "mac": {
    "target": [
      { "target": "dmg", "arch": ["universal"] },
      { "target": "zip", "arch": ["universal"] }
    ]
  }
}
```

**Pros:**
- ✅ Un solo archivo funciona en Intel y Apple Silicon
- ✅ Mejor experiencia de usuario (no confusión sobre qué versión descargar)
- ✅ Ejecuta nativamente en ambas plataformas

**Contras:**
- ❌ Tamaño del archivo ~2x (incluye ambos binarios)
- ❌ Requiere compilar en macOS con soporte para ambas arquitecturas

---

### Opción 2: Builds Separados (x64 y arm64)

```json
{
  "mac": {
    "target": [
      { "target": "dmg", "arch": ["x64", "arm64"] }
    ]
  }
}
```

**Pros:**
- ✅ Archivos más pequeños
- ✅ Cada usuario descarga solo lo que necesita
- ✅ Puede compilarse en runners separados (más rápido en CI)

**Contras:**
- ❌ Usuario debe elegir qué versión descargar
- ❌ Requiere documentación clara sobre compatibilidad

---

### Opción 3: Solo arm64 (Si abandonas soporte Intel)

```json
{
  "mac": {
    "target": [
      { "target": "dmg", "arch": ["arm64"] }
    ]
  }
}
```

**Cuándo usar:**
- Si tus usuarios objetivo solo tienen Macs M1/M2/M3
- Si quieres forzar migración a Apple Silicon
- Para apps internas/empresariales con hardware controlado

**⚠️ Nota**: Macs Intel NO podrán ejecutar builds arm64 puros.

---

## 🏗️ Estrategias de Compilación en CI/CD

### Estrategia A: Un Job, Build Universal (Actual)

```yaml
build-macos-universal:
  runs-on: macos-14  # Apple Silicon runner
  steps:
    - run: npm run rebuild:x64
    - run: npm run rebuild:arm64
    - run: npm run build:mac:universal
```

**Pros:**
- ✅ Un solo artefacto final
- ✅ Proceso más simple

**Contras:**
- ❌ Más lento (compila ambas arquitecturas secuencialmente)
- ❌ Requiere runner Apple Silicon

---

### Estrategia B: Jobs Paralelos + Combinación (Más Rápido)

```yaml
jobs:
  build-x64:
    runs-on: macos-13
    steps:
      - run: npm run rebuild:x64
      - run: npm run build:mac:x64
      - uses: actions/upload-artifact@v4
        with:
          name: skylab-x64
          path: release-builds/mac/

  build-arm64:
    runs-on: macos-14
    steps:
      - run: npm run rebuild:arm64
      - run: npm run build:mac:arm64
      - uses: actions/upload-artifact@v4
        with:
          name: skylab-arm64
          path: release-builds/mac-arm64/

  combine-universal:
    needs: [build-x64, build-arm64]
    runs-on: macos-14
    steps:
      - uses: actions/download-artifact@v4
      - run: |
          # Combinar binarios con lipo
          lipo -create \
            skylab-x64/SkyLab.app/Contents/MacOS/SkyLab \
            skylab-arm64/SkyLab.app/Contents/MacOS/SkyLab \
            -output SkyLab-universal
      - run: # Crear DMG universal...
```

**Pros:**
- ✅ Compilación paralela (más rápido)
- ✅ Puede distribuir builds separados también

**Contras:**
- ❌ Más complejo
- ❌ Requiere script de combinación manual

---

## 🔄 Recompilación de Módulos Nativos

### Opción A: electron-rebuild (Actual - Recomendada)

```json
{
  "scripts": {
    "rebuild:arm64": "electron-rebuild --arch=arm64",
    "postinstall": "electron-builder install-app-deps"
  }
}
```

**Cuándo usar:**
- ✅ Para proyectos con pocos módulos nativos
- ✅ Cuando necesitas control fino sobre qué recompilar

---

### Opción B: @electron/rebuild (Más Moderna)

```bash
npm install --save-dev @electron/rebuild
```

```json
{
  "scripts": {
    "rebuild": "electron-rebuild",
    "rebuild:arm64": "electron-rebuild -a arm64",
    "rebuild:x64": "electron-rebuild -a x64"
  }
}
```

**Diferencias:**
- Mantiene mejor compatibilidad con versiones nuevas de Electron
- Interfaz API más moderna

---

### Opción C: node-gyp Manual

```bash
# Para módulos específicos que fallan con electron-rebuild
cd node_modules/tu-modulo-nativo
node-gyp rebuild --target=35.7.5 --arch=arm64 --dist-url=https://electronjs.org/headers
```

**Cuándo usar:**
- Para debugging de problemas de compilación
- Módulos nativos problemáticos

---

## 🍎 Entitlements: Configuraciones Según Uso

### Configuración Actual (Permisiva - Desarrollo)

```xml
<!-- build/entitlements.mac.plist -->
<key>com.apple.security.cs.allow-jit</key>
<true/>
<key>com.apple.security.cs.allow-unsigned-executable-memory</key>
<true/>
```

**Cuándo usar:**
- ✅ Durante desarrollo
- ✅ Apps que usan JIT (V8, JavaScript)
- ✅ Apps con módulos nativos de terceros sin firmar

---

### Configuración Restrictiva (Producción Segura)

```xml
<plist version="1.0">
  <dict>
    <!-- Solo permisos necesarios -->
    <key>com.apple.security.network.client</key>
    <true/>
    <key>com.apple.security.network.server</key>
    <true/>
    <key>com.apple.security.files.downloads.read-write</key>
    <true/>
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>
    
    <!-- NO incluir JIT/unsigned memory si no es necesario -->
  </dict>
</plist>
```

**Ventajas:**
- ✅ Mayor seguridad
- ✅ Menos probabilidad de rechazo en notarización
- ✅ Mejor protección contra malware

**Desventajas:**
- ❌ Puede romper funcionalidad si Electron necesita JIT
- ❌ Requiere testing exhaustivo

---

### Entitlements para App Sandbox (App Store)

```xml
<plist version="1.0">
  <dict>
    <key>com.apple.security.app-sandbox</key>
    <true/>
    <key>com.apple.security.network.client</key>
    <true/>
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>
  </dict>
</plist>
```

**Solo si distribuyes en Mac App Store** (no recomendado para Electron generalmente).

---

## 🔐 Métodos de Notarización

### Método 1: App-Specific Password (Actual - Más Simple)

```bash
xcrun notarytool submit app.dmg \
  --apple-id "tu@email.com" \
  --password "xxxx-xxxx-xxxx-xxxx" \
  --team-id "XXXXXXXXXX" \
  --wait
```

**Pros:**
- ✅ Fácil de configurar
- ✅ Funciona inmediatamente

**Contras:**
- ❌ Password puede expirar
- ❌ Menos seguro que API Key

---

### Método 2: API Key (Más Seguro)

```bash
xcrun notarytool submit app.dmg \
  --key /path/to/AuthKey_XXXXXXXXXX.p8 \
  --key-id "XXXXXXXXXX" \
  --issuer "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" \
  --wait
```

**Pros:**
- ✅ No expira (a menos que la revokes)
- ✅ Más seguro (permisos granulares)
- ✅ Recomendado por Apple

**Contras:**
- ❌ Configuración inicial más compleja

---

### Método 3: Keychain Profile (Más Conveniente Local)

```bash
# Crear profile guardado en keychain
xcrun notarytool store-credentials "skylab-notary" \
  --apple-id "tu@email.com" \
  --password "xxxx-xxxx-xxxx-xxxx" \
  --team-id "XXXXXXXXXX"

# Usar después
xcrun notarytool submit app.dmg --keychain-profile "skylab-notary" --wait
```

**Pros:**
- ✅ No necesitas pasar credenciales cada vez
- ✅ Mejor para desarrollo local

**Contras:**
- ❌ Solo local (no funciona en CI sin configuración adicional)

---

## 📊 Tamaños de Build Aproximados

| Arquitectura | App (.app) | DMG Comprimido | ZIP |
|--------------|-----------|----------------|-----|
| x64 solo     | ~150 MB   | ~50 MB         | ~55 MB |
| arm64 solo   | ~140 MB   | ~47 MB         | ~52 MB |
| Universal    | ~280 MB   | ~90 MB         | ~100 MB |

**Consideraciones:**
- Tamaños varían según dependencias
- DMG tiene mejor compresión que ZIP
- Considera ofrecer ambos formatos

---

## 🚀 Optimizaciones de Tamaño

### 1. Excluir Archivos Innecesarios

```json
{
  "build": {
    "files": [
      "**/*",
      "!**/*.md",
      "!**/*.map",
      "!**/LICENSE",
      "!docs/**/*",
      "!.github/**/*"
    ]
  }
}
```

### 2. Comprimir con asar

```json
{
  "build": {
    "asar": true,
    "asarUnpack": [
      "**/node_modules/sharp/**/*",
      "**/node_modules/@serialport/**/*"
    ]
  }
}
```

**⚠️ Nota**: Algunos módulos nativos necesitan estar desempaquetados.

### 3. Excluir Dev Dependencies

```json
{
  "build": {
    "npmRebuild": false,  // Ya usaste electron-rebuild
    "nodeGypRebuild": false
  }
}
```

---

## 🧪 Testing en Múltiples Arquitecturas

### En macOS Local

```bash
# Forzar ejecución bajo Rosetta (para testar x64 en Apple Silicon)
arch -x86_64 open -a "SkyLab.app"

# Forzar ejecución nativa arm64
arch -arm64 open -a "SkyLab.app"

# Ver qué arquitectura está usando
ps aux | grep SkyLab
lsof -p $(pgrep SkyLab) | grep dylib
```

### En GitHub Actions (Matrix Build)

```yaml
strategy:
  matrix:
    os: [macos-13, macos-14]  # Intel y Apple Silicon
    arch: [x64, arm64]
    exclude:
      - os: macos-13
        arch: arm64
      - os: macos-14
        arch: x64
```

---

## 📈 Mejores Prácticas de Distribución

### 1. Versionado Semántico

```json
{
  "version": "0.1.1",
  "bundleVersion": "1"
}
```

- `version`: Visible al usuario (0.1.1)
- `bundleVersion`: Build number interno (incrementa en cada release)

### 2. Auto-Update (Opcional)

```bash
npm install --save electron-updater
```

```javascript
// main.js
const { autoUpdater } = require('electron-updater');

app.whenReady().then(() => {
  autoUpdater.checkForUpdatesAndNotify();
});
```

**Configuración:**
```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "Labit-Group",
      "repo": "skylab-electron"
    }
  }
}
```

### 3. Releases Automatizados en GitHub

```yaml
# .github/workflows/release.yml
on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    steps:
      - run: npm run build:mac:universal
      - uses: softprops/action-gh-release@v1
        with:
          files: |
            release-builds/*.dmg
            release-builds/*.zip
```

---

## 🔍 Debugging Avanzado

### Ver Dependencias del Binario

```bash
# Ver todas las librerías que usa
otool -L release-builds/mac-universal/SkyLab.app/Contents/MacOS/SkyLab

# Ver símbolos exportados
nm -g release-builds/mac-universal/SkyLab.app/Contents/MacOS/SkyLab | head
```

### Ver Qué Arquitectura Carga en Runtime

```bash
# Instrumentar con dtrace (macOS)
sudo dtrace -n 'proc:::exec-success /execname == "SkyLab"/ { printf("%s %s", execname, curthread->td_proc->p_comm); }'
```

### Analizar Tamaño de Binario

```bash
# Ver qué ocupa espacio
du -sh release-builds/mac-universal/SkyLab.app/Contents/*

# Ver tamaño de cada arquitectura en universal binary
size -A release-builds/mac-universal/SkyLab.app/Contents/MacOS/SkyLab
```

---

## 🎓 Recursos de Aprendizaje

### Documentación Oficial
- [Electron on Apple Silicon](https://www.electronjs.org/docs/latest/tutorial/apple-silicon)
- [electron-builder macOS](https://www.electron.build/configuration/mac)
- [Apple Code Signing](https://developer.apple.com/documentation/xcode/notarizing_macos_software_before_distribution)

### Herramientas Útiles
- **Suspicious Package**: Inspeccionar instaladores macOS
- **App Wrapper**: Agregar sandboxing
- **RB App Checker**: Verificar rechazos de App Store

---

## ⚡ Performance Tips

### 1. Lazy Loading de Módulos

```javascript
// En lugar de
const Store = require('electron-store');

// Usa (solo cuando sea necesario)
let store;
function getStore() {
  if (!store) {
    const Store = require('electron-store');
    store = new Store();
  }
  return store;
}
```

### 2. V8 Heap Optimization

```javascript
// main.js
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096');
```

### 3. GPU Acceleration (Ya configurado en tu app)

```javascript
// Para desactivar si causa problemas
app.disableHardwareAcceleration();
```

---

¡Configuraciones alternativas completas! 🎯
