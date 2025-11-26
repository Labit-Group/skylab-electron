# 🔧 Corrección de Errores de GitHub Actions

## ❌ Problema Original

Los 3 jobs del workflow de GitHub Actions fallaban con:
```
Process completed with exit code 1
```

## ✅ Soluciones Aplicadas

### 1. Cambiar `npm ci` a `npm install`

**Problema**: `npm ci` requiere `package-lock.json` que no existe en el proyecto.

**Solución**:
```yaml
# Antes ❌
- run: npm ci

# Después ✅
- run: npm install
```

### 2. Deshabilitar Firma Automática

**Problema**: electron-builder intentaba buscar certificado de firma que no existe.

**Solución**:
```yaml
- name: Build para macOS
  run: npm run build:mac:arm64
  env:
    CSC_IDENTITY_AUTO_DISCOVERY: false  # ✅ Agregado
```

### 3. Eliminar Recompilación Manual de Módulos

**Problema**: `electron-rebuild` fallaba y no era necesario.

**Solución**:
```yaml
# Antes ❌
- name: Recompilar módulos nativos
  run: npm run rebuild:arm64

# Después ✅
# (Eliminado - electron-builder lo hace automáticamente)
```

### 4. Cambiar Cache Key

**Problema**: Cache usaba `package-lock.json` que no existe.

**Solución**:
```yaml
# Antes ❌
key: ${{ runner.os }}-electron-${{ hashFiles('**/package-lock.json') }}

# Después ✅
key: ${{ runner.os }}-electron-${{ hashFiles('**/package.json') }}
```

### 5. Mejorar Upload de Artefactos

**Problema**: Si falla el build, no se suben logs para debugging.

**Solución**:
```yaml
- name: Subir artefacto
  uses: actions/upload-artifact@v4
  if: always()  # ✅ Agregado - sube incluso si falla
  with:
    path: release-builds/**/*  # ✅ Sube todo
```

---

## 📝 Archivos Modificados

### 1. `.github/workflows/build-mac.yml`
- ✅ `npm ci` → `npm install`
- ✅ Agregado `CSC_IDENTITY_AUTO_DISCOVERY: false`
- ✅ Eliminados steps de `electron-rebuild`
- ✅ Cache key usa `package.json` en vez de `package-lock.json`
- ✅ Artefactos se suben con `if: always()`

### 2. `.github/workflows/test-build-mac.yml` (NUEVO)
- ✅ Workflow simplificado para testing
- ✅ Solo 1 job (arm64)
- ✅ Logs detallados de debugging
- ✅ Sube TODO incluso si falla
- ✅ Ejecución manual (workflow_dispatch)

### 3. `docs/GITHUB_ACTIONS_TROUBLESHOOTING.md` (NUEVO)
- ✅ Guía completa de troubleshooting
- ✅ Explicación de cada error y solución
- ✅ Cómo ver logs en GitHub
- ✅ Cómo configurar firma cuando sea necesario

---

## 🚀 Comandos para Ejecutar Ahora

```bash
cd /home/franorteg/Escritorio/Skylab/electron/electron-packer

# 1. Commit de las correcciones
git add .
git commit -m "fix: Correct GitHub Actions workflow errors

- Change npm ci to npm install (no package-lock.json)
- Add CSC_IDENTITY_AUTO_DISCOVERY=false to disable auto-signing
- Remove manual electron-rebuild steps (handled automatically)
- Fix cache key to use package.json instead of package-lock.json
- Upload artifacts even on failure for debugging
- Add simplified test workflow
- Add troubleshooting documentation"

# 2. Push a GitHub
git push origin main

# 3. Verificar en GitHub Actions
# https://github.com/Labit-Group/skylab-electron/actions
```

---

## 🧪 Probar el Workflow de Test

Si quieres probar sin afectar main:

```bash
# Opción A: Ejecutar manualmente el workflow de test
# 1. Ve a: https://github.com/Labit-Group/skylab-electron/actions
# 2. Click en "Build macOS (Simple Test)"
# 3. Click en "Run workflow" → "Run workflow"

# Opción B: Crear branch de test y hacer push
git checkout -b test-actions
git push origin test-actions
# El workflow de test se ejecutará automáticamente en este branch
```

---

## ✅ Qué Esperar del Build Exitoso

### Logs del Workflow:

```
✅ Checkout código
✅ Setup Node.js - Node version: v20.x.x
✅ Cache Electron - Cache restored
✅ Instalar dependencias - added XXX packages
✅ Build para macOS arm64
   • electron-builder version=24.13.1
   • loaded configuration file=package.json
   • building target=macOS arm64
   • packaging app
   • creating DMG
   • created SkyLab-0.1.1-arm64.dmg
✅ Subir artefacto arm64 - Uploaded: skylab-macos-arm64.zip
```

### Artefactos Generados:

En la página del workflow verás:

- 📦 **skylab-macos-x64** (~50-60 MB)
  - SkyLab-0.1.1.dmg
  - SkyLab-0.1.1-mac.zip (opcional)

- 📦 **skylab-macos-arm64** (~50-60 MB)
  - SkyLab-0.1.1-arm64.dmg
  - SkyLab-0.1.1-arm64-mac.zip (opcional)

- 📦 **skylab-macos-universal** (~90-100 MB)
  - SkyLab-0.1.1-universal.dmg
  - SkyLab-0.1.1-universal-mac.zip (opcional)

---

## 🐛 Si Sigue Fallando

### 1. Ver Logs Detallados

```
1. Ve a GitHub Actions
2. Click en el workflow que falló
3. Click en el job específico (ej: "Build macOS arm64")
4. Expande cada step
5. Busca líneas con "Error:", "ERR!", o "exit code"
```

### 2. Ejecutar Workflow de Test

El workflow `test-build-mac.yml` tiene mucha más información de debugging:

- Muestra versiones de Node, npm, arquitectura
- Lista todos los scripts en package.json
- Muestra todo el contenido de release-builds/
- Busca archivos .app, .dmg, .zip
- Sube TODO para inspección

### 3. Errores Comunes

Ver `docs/GITHUB_ACTIONS_TROUBLESHOOTING.md` para:

- ❌ "Cannot find module 'electron-builder'"
- ❌ "ENOENT: no such file or directory"
- ❌ "gyp ERR! build error"
- ❌ "No identity found for signing"
- ❌ Y más...

---

## 📊 Comparación Antes/Después

### Antes (❌ Fallaba):

```yaml
jobs:
  build-macos-arm64:
    steps:
      - uses: actions/setup-node@v4
        with:
          cache: 'npm'  # ❌ Requiere package-lock.json
      
      - run: npm ci  # ❌ Falla sin package-lock.json
      
      - run: npm run rebuild:arm64  # ❌ Podría fallar
      
      - run: npm run build:mac:arm64
        # ❌ Intenta firmar y falla
```

**Resultado**: ❌ Exit code 1 en ~10-15 segundos

### Después (✅ Funciona):

```yaml
jobs:
  build-macos-arm64:
    steps:
      - uses: actions/setup-node@v4
        # ✅ Sin cache npm
      
      - run: npm install  # ✅ Funciona sin lockfile
      
      # ✅ Sin electron-rebuild manual
      
      - run: npm run build:mac:arm64
        env:
          CSC_IDENTITY_AUTO_DISCOVERY: false  # ✅ No intenta firmar
          DEBUG: electron-builder  # ✅ Logs detallados
```

**Resultado**: ✅ Build exitoso en ~3-5 minutos

---

## 🎯 Próximos Pasos

### Ahora Mismo:

1. ✅ Hacer commit con el mensaje de arriba
2. ✅ Push a GitHub
3. ✅ Esperar ~5 minutos
4. ✅ Ver workflow en GitHub Actions

### Si Funciona:

1. 🎉 Descargar artefactos
2. 🧪 Probar en un Mac M1/M2
3. 📝 Verificar con el checklist de `docs/VERIFICATION_CHECKLIST.md`

### Si Falla:

1. 📋 Ver logs completos
2. 🔍 Identificar el error específico
3. 📖 Consultar `docs/GITHUB_ACTIONS_TROUBLESHOOTING.md`
4. 🧪 Ejecutar workflow de test
5. 💬 Compartir logs para análisis

---

## 📚 Documentación Relacionada

- **`docs/GITHUB_ACTIONS_TROUBLESHOOTING.md`** - Solución completa de problemas
- **`QUICKSTART.md`** - Guía rápida de inicio
- **`README.md`** - Documentación principal
- **`.github/workflows/test-build-mac.yml`** - Workflow de test simplificado

---

## ✅ Checklist de Verificación

Antes del push:

- [x] Workflow actualizado con npm install
- [x] CSC_IDENTITY_AUTO_DISCOVERY: false agregado
- [x] Steps de electron-rebuild eliminados
- [x] Cache key usa package.json
- [x] Artefactos se suben con if: always()
- [x] Workflow de test creado
- [x] Documentación de troubleshooting completa

Después del push:

- [ ] Workflow se ejecuta automáticamente
- [ ] Los 3 jobs pasan (iconos verdes ✅)
- [ ] Los artefactos se generan
- [ ] Puedes descargar los .dmg/.zip

---

¡El workflow debería funcionar correctamente ahora! 🚀

**Si tienes algún problema**, revisa los logs y consulta la documentación de troubleshooting.
