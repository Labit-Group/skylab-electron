# 🚀 Guía de Uso del Workflow

## ✅ Configuración Actual

El workflow de GitHub Actions se ejecuta **automáticamente** cuando:

- ✅ Modificas archivos **`.js`** (código JavaScript)
- ✅ Modificas archivos **`.json`** (package.json, etc.)
- ✅ Modificas archivos **`.css`** (estilos)
- ✅ Modificas archivos **`.html`** (HTML)
- ✅ Modificas archivos en **`assets/`** (iconos, imágenes)

El workflow **NO se ejecuta** cuando:

- ❌ Modificas archivos **`.md`** (documentación)
- ❌ Modificas archivos en **`docs/`** (documentación)

---

## 📝 Ejemplos de Uso

### 1. Push de Código → Build Automático ✅

```bash
# Modificas código
vim main.js
vim renderer.js

# Commit y push
git add main.js renderer.js
git commit -m "feat: Add new feature"
git push origin main

# ✅ Workflow se ejecuta automáticamente
```

### 2. Push de Documentación → Sin Build ✅

```bash
# Modificas documentación
vim README.md
vim docs/GUIDE.md

# Commit y push
git add README.md docs/
git commit -m "docs: Update README"
git push origin main

# ❌ Workflow NO se ejecuta (ahorra tiempo)
```

### 3. Push de Código pero NO Quieres Build

```bash
# Modificas código pero es un cambio menor
vim main.js

# Usa [skip ci] en el mensaje
git add main.js
git commit -m "style: Format code [skip ci]"
git push origin main

# ❌ Workflow NO se ejecuta (forzado por [skip ci])
```

### 4. Push de Documentación pero SÍ Quieres Build

```bash
# Opción A: Ejecutar manualmente desde GitHub
# 1. Ve a: https://github.com/Labit-Group/skylab-electron/actions
# 2. Click "Build macOS (arm64 only)"
# 3. Click "Run workflow" → Selecciona "main" → "Run workflow"

# Opción B: Modificar también algún archivo de código
git add README.md main.js
git commit -m "docs: Update README and minor fix"
git push
```

---

## 🎯 Quick Reference

| Acción | Comando | ¿Ejecuta Workflow? |
|--------|---------|-------------------|
| **Modificar código** | `git commit -m "feat: New feature"` | ✅ SÍ |
| **Modificar docs** | `git commit -m "docs: Update README"` | ❌ NO |
| **Código con skip** | `git commit -m "fix: Minor [skip ci]"` | ❌ NO |
| **Ejecución manual** | GitHub Actions UI → "Run workflow" | ✅ SÍ |

---

## 🔧 Tags de Skip CI

Puedes usar cualquiera de estos en el mensaje de commit:

```bash
[skip ci]       # Más común ⭐
[ci skip]
[no ci]
[skip actions]
```

**Ejemplo:**
```bash
git commit -m "docs: Update documentation [skip ci]"
```

---

## 📊 ¿Cuándo se Ejecuta el Workflow?

```
CÓDIGO MODIFICADO:
├── main.js                    → ✅ Ejecuta workflow
├── renderer.js                → ✅ Ejecuta workflow
├── downloadProgress/*.js      → ✅ Ejecuta workflow
├── package.json               → ✅ Ejecuta workflow
├── downloadProgress/*.css     → ✅ Ejecuta workflow
├── downloadProgress/*.html    → ✅ Ejecuta workflow
└── assets/icons/*.png         → ✅ Ejecuta workflow

DOCUMENTACIÓN MODIFICADA:
├── README.md                  → ❌ NO ejecuta
├── docs/*.md                  → ❌ NO ejecuta
├── BUILD_SUCCESS.md           → ❌ NO ejecuta
└── QUICKSTART.md              → ❌ NO ejecuta

OVERRIDE (FORZADO):
└── Cualquier archivo + [skip ci]  → ❌ NO ejecuta (forzado)
```

---

## ⏱️ Tiempo de Ejecución

- **Workflow arm64**: ~1 minuto 11 segundos
- **Artefacto generado**: 198 MB

---

## 🎉 Ventajas de esta Configuración

✅ **Automático**: Builds cuando cambias código  
✅ **Eficiente**: Sin builds para documentación  
✅ **Flexible**: Override con `[skip ci]`  
✅ **Manual**: Siempre puedes ejecutar desde GitHub UI  
✅ **Rápido**: Solo 1 minuto por build

---

## 🚀 Flujo de Trabajo Típico

```bash
# Día 1: Trabajas en código
git add main.js renderer.js
git commit -m "feat: Add new feature"
git push
# → Build automático (1m 11s)

# Día 2: Actualizas docs
git add README.md docs/
git commit -m "docs: Update documentation"
git push
# → Sin build (instantáneo)

# Día 3: Cambio menor en código
git add main.js
git commit -m "style: Format code [skip ci]"
git push
# → Sin build (skip forzado)

# Día 4: Nueva versión
git add package.json main.js
git commit -m "feat: Release v0.1.2"
git push
# → Build automático (1m 11s)
```

---

## 📋 Checklist Antes de Push

```bash
# 1. ¿Qué archivos modificaste?
git status

# 2. ¿Es código o documentación?
#    - Código → Push normal (auto-build)
#    - Docs → Push normal (sin build automático)

# 3. ¿Quieres forzar skip?
#    - Sí → Usa [skip ci]
#    - No → Commit normal

# 4. Push
git push origin main
```

---

## 🎯 Comandos Útiles

```bash
# Ver último workflow
gh run list --limit 1

# Ver workflows en ejecución
gh run list --status in_progress

# Cancelar workflow en ejecución
gh run cancel <run-id>

# Ver logs del último workflow
gh run view --log

# Ejecutar workflow manualmente (requiere gh cli)
gh workflow run build-mac.yml
```

---

## ❓ FAQ

**P: ¿Puedo cambiar los archivos que activan el workflow?**  
R: Sí, edita `.github/workflows/build-mac.yml` en la sección `paths:`

**P: ¿Qué pasa si hago push de código Y documentación juntos?**  
R: El workflow SE EJECUTA (porque hay archivos de código modificados)

**P: ¿Puedo desactivar completamente el workflow automático?**  
R: Sí, comenta las líneas `push:` y `pull_request:` en el workflow

**P: ¿[skip ci] funciona en merge commits?**  
R: Sí, funciona en cualquier tipo de commit

---

**¡Listo para usar!** 🚀

Tu workflow ahora es:
- ✅ Inteligente (detecta tipo de cambio)
- ✅ Flexible (override con [skip ci])
- ✅ Eficiente (solo builds necesarios)
