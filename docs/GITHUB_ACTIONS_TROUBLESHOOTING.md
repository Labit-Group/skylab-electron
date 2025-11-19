# 🔧 Solución de Problemas de GitHub Actions

## ❌ Error: "Process completed with exit code 1"

Este error genérico puede tener varias causas. Aquí están las soluciones:

### Problema 1: No existe package-lock.json

**Error:**
```
npm ERR! `npm ci` can only install packages when your package.json and package-lock.json or npm-shrinkwrap.json are in sync
```

**Solución aplicada:**
- ✅ Cambiado de `npm ci` a `npm install` en el workflow
- ✅ Cambiado cache key de `package-lock.json` a `package.json`

### Problema 2: electron-builder intenta firmar sin certificado

**Error:**
```
Error: No identity found for signing
```

**Solución aplicada:**
- ✅ Agregado `CSC_IDENTITY_AUTO_DISCOVERY: false` en todos los jobs
- Esto deshabilita la firma automática cuando no hay certificado

### Problema 3: electron-rebuild falla

**Error:**
```
gyp ERR! build error
```

**Solución aplicada:**
- ✅ Eliminados los pasos de `electron-rebuild` del workflow
- El script `postinstall` en package.json ya se encarga de esto
- electron-builder recompila automáticamente cuando es necesario

---

## 🔍 Cómo Ver los Logs Detallados

### En GitHub:

1. Ve a tu repositorio: https://github.com/Labit-Group/skylab-electron
2. Click en **Actions**
3. Click en el workflow que falló
4. Click en el job que falló (ej: "Build macOS x64")
5. Expande cada paso para ver el log completo

### Buscar Errores Específicos:

```bash
# En los logs, busca estas líneas:
ERROR
Error:
gyp ERR!
npm ERR!
exit code 1
```

---

## 🛠️ Cambios Realizados al Workflow

### Antes (❌ Fallaba):
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'  # ❌ Requiere package-lock.json

- name: Instalar dependencias
  run: npm ci  # ❌ Requiere package-lock.json

- name: Recompilar módulos nativos
  run: npm run rebuild:arm64  # ❌ Podría fallar

- name: Build
  run: npm run build:mac:arm64
  # ❌ Falta CSC_IDENTITY_AUTO_DISCOVERY: false
```

### Después (✅ Funciona):
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    # ✅ Sin cache de npm (o usa package.json)

- name: Instalar dependencias
  run: npm install  # ✅ Funciona sin lockfile

- name: Build
  run: npm run build:mac:arm64
  env:
    CSC_IDENTITY_AUTO_DISCOVERY: false  # ✅ Deshabilita firma
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    DEBUG: electron-builder  # ✅ Logs detallados
```

---

## 🧪 Workflow de Test

He creado un workflow simplificado para debugging: `.github/workflows/test-build-mac.yml`

**Para ejecutarlo manualmente:**

1. Ve a: https://github.com/Labit-Group/skylab-electron/actions
2. Click en "Build macOS (Simple Test)" en el menú izquierdo
3. Click en "Run workflow" → Selecciona branch "main" → "Run workflow"

Este workflow:
- ✅ Muestra información del sistema
- ✅ Instala dependencias
- ✅ Intenta build arm64
- ✅ Muestra todos los archivos generados
- ✅ Sube TODO (incluso si falla) para debugging

---

## 📦 Generar package-lock.json (Opcional)

Si prefieres usar `npm ci` (más rápido y determinista):

```bash
# En tu máquina local
cd /home/franorteg/Escritorio/Skylab/electron/electron-packer

# Generar package-lock.json
npm install

# Commit
git add package-lock.json
git commit -m "chore: Add package-lock.json for deterministic builds"
git push

# Luego actualiza el workflow a:
# - run: npm ci
# - cache: 'npm'
# - key: hashFiles('**/package-lock.json')
```

---

## 🔐 Configurar Firma (Cuando Tengas Certificado)

### 1. Crear Secrets en GitHub

Ve a: https://github.com/Labit-Group/skylab-electron/settings/secrets/actions

Agrega:
- `MAC_CERTIFICATE_BASE64` - Certificado .p12 en base64
- `MAC_CERTIFICATE_PASSWORD` - Password del certificado
- `APPLE_ID` - tu-email@example.com
- `APPLE_APP_SPECIFIC_PASSWORD` - xxxx-xxxx-xxxx-xxxx
- `APPLE_TEAM_ID` - XXXXXXXXXX

### 2. Actualizar el Workflow

En `.github/workflows/build-mac.yml`, descomenta:

```yaml
- name: Build Universal para macOS
  run: npm run build:mac:universal
  env:
    # DESCOMENTAR ESTAS LÍNEAS:
    CSC_LINK: ${{ secrets.MAC_CERTIFICATE_BASE64 }}
    CSC_KEY_PASSWORD: ${{ secrets.MAC_CERTIFICATE_PASSWORD }}
    APPLE_ID: ${{ secrets.APPLE_ID }}
    APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
    APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
    # Y COMENTAR ESTA:
    # CSC_IDENTITY_AUTO_DISCOVERY: false
```

---

## ⚡ Optimizaciones del Workflow

### Usar Cache para Electron

El workflow ya usa cache para Electron:

```yaml
- name: Cache Electron
  uses: actions/cache@v4
  with:
    path: ${{ github.workspace }}/.cache
    key: ${{ runner.os }}-electron-arm64-${{ hashFiles('**/package.json') }}
```

Esto guarda ~200MB de descarga de Electron entre builds.

### Ejecutar Solo el Job que Necesites

Puedes comentar jobs que no necesites temporalmente:

```yaml
jobs:
  # build-macos-x64:  # ← Comentar esto
  #   name: Build macOS x64
  #   ... todo el job comentado
  
  build-macos-arm64:  # ← Mantener solo este
    name: Build macOS arm64
    ...
```

---

## 📊 Verificar Resultado del Build

### Si el Build es Exitoso:

1. Los artefactos aparecerán en la página del workflow
2. Descarga `skylab-macos-arm64.zip` (o el que necesites)
3. Descomprimir y probar en un Mac

### Verificar Arquitectura del Build:

```bash
# Después de descargar el artefacto
unzip skylab-macos-arm64.zip

# Buscar la app
find . -name "*.app"

# Verificar arquitectura
lipo -info ./path/to/SkyLab.app/Contents/MacOS/SkyLab
```

---

## 🐛 Debugging Avanzado

### Habilitar SSH en el Runner (Para Debugging)

Agrega este step ANTES del que falla:

```yaml
- name: Setup tmate session
  uses: mxschmitt/action-tmate@v3
  if: failure()  # Solo si falla el build anterior
  timeout-minutes: 30
```

Esto te dará acceso SSH al runner para investigar.

### Ver Variables de Entorno

Agrega un step de debug:

```yaml
- name: Debug - Ver variables
  run: |
    echo "Node: $(node --version)"
    echo "npm: $(npm --version)"
    echo "Arch: $(uname -m)"
    echo "PWD: $(pwd)"
    echo "Contenido:"
    ls -la
    echo "package.json scripts:"
    cat package.json | grep -A 20 scripts
```

---

## 📝 Checklist de Verificación

Antes de hacer push:

- [ ] package.json tiene los scripts correctos
- [ ] (Opcional) package-lock.json existe
- [ ] .github/workflows/build-mac.yml está actualizado
- [ ] CSC_IDENTITY_AUTO_DISCOVERY: false está configurado
- [ ] DEBUG: electron-builder está habilitado (para ver logs)

Después del push:

- [ ] El workflow se ejecuta automáticamente
- [ ] Todos los steps pasan (iconos verdes ✅)
- [ ] Los artefactos se generan
- [ ] Puedes descargar los artefactos

---

## 🎯 Próximos Pasos

### Si el Build Funciona:

1. ✅ Descargar artefactos
2. ✅ Probar en un Mac M1/M2
3. ✅ Verificar arquitectura con `lipo -info`
4. ✅ (Opcional) Configurar firma y notarización

### Si Sigue Fallando:

1. Revisa los logs detallados en GitHub Actions
2. Busca el error específico
3. Ejecuta el workflow de test: `test-build-mac.yml`
4. Comparte el log del error para análisis

---

## 📞 Errores Comunes y Soluciones

### Error: "Cannot find module 'electron-builder'"

**Solución:**
```bash
# El problema está en package.json
# Verifica que electron-builder esté en devDependencies
```

### Error: "ENOENT: no such file or directory, open 'release-builds/...'"

**Solución:**
- El build falló antes de generar archivos
- Revisa el step anterior en los logs
- Probablemente electron-builder falló por firma

### Error: "gyp ERR! build error"

**Solución:**
- Módulo nativo no pudo compilarse
- En el workflow actual, esto se maneja automáticamente
- Si persiste, podría ser un problema de dependencias

---

## ✅ Commits Recomendados

Después de los cambios:

```bash
git add .github/workflows/
git commit -m "fix: Update GitHub Actions workflow for macOS builds

- Change npm ci to npm install (no package-lock.json)
- Add CSC_IDENTITY_AUTO_DISCOVERY: false (disable signing)
- Remove electron-rebuild steps (handled by postinstall)
- Add DEBUG: electron-builder for detailed logs
- Add test workflow for debugging"
git push
```

---

¡El workflow debería funcionar ahora! 🚀

Si sigue habiendo problemas, ejecuta el workflow de test y comparte los logs.
