# 🚀 Quick Start - Instalador Windows

## ⚡ Generar Instaladores (Local)

### Opción 1: Todas las Arquitecturas (Recomendado)

```bash
# Genera instaladores para x64, ia32 y arm64
npm run dist:win
```

**Output:**
```
release-builds/
├── SkyLab-Setup-0.1.1-x64.exe      ✅ 64-bit (más común)
├── SkyLab-Setup-0.1.1-ia32.exe     ✅ 32-bit (PCs antiguas)
├── SkyLab-Setup-0.1.1-arm64.exe    ✅ ARM64 (Surface Pro X)
└── SkyLab-0.1.1-x64.exe            ✅ Portable (sin instalación)
```

### Opción 2: Solo x64 (Más Rápido)

```bash
# Solo para PCs modernas (64-bit)
npm run dist:win:x64
```

**Output:**
```
release-builds/
├── SkyLab-Setup-0.1.1-x64.exe      ✅ Instalador
└── SkyLab-0.1.1-x64.exe            ✅ Portable
```

---

## 📦 ¿Qué Instalador Usar?

| Usuario | Arquitectura | Archivo |
|---------|--------------|---------|
| **99% de usuarios** | x64 | `SkyLab-Setup-0.1.1-x64.exe` ⭐ |
| PC antigua (pre-2010) | ia32 | `SkyLab-Setup-0.1.1-ia32.exe` |
| Surface Pro X | arm64 | `SkyLab-Setup-0.1.1-arm64.exe` |
| Sin instalar | Portable | `SkyLab-0.1.1-x64.exe` |

**Recomendación**: Distribuye solo **x64** a menos que tu equipo tenga PCs antiguas.

---

## 🔧 Instalación (Para Usuarios Finales)

### Método Normal (NSIS Installer)

1. **Ejecutar** `SkyLab-Setup-0.1.1-x64.exe`
2. **Aceptar** UAC (permisos de administrador)
3. **Siguiente** → **Siguiente** → **Instalar**
4. **Finalizar** (marca "Iniciar SkyLab")

**Se instala en:**
- `C:\Program Files\SkyLab\` ← Aplicación
- Escritorio ← Acceso directo ✅
- Menú Inicio ← Acceso directo ✅

### Método Portable (Sin instalación)

1. **Ejecutar** `SkyLab-0.1.1-x64.exe` directamente
2. No requiere instalación
3. Se puede ejecutar desde USB

---

## 🎯 Características del Instalador

✅ **Instalación en Program Files** (para todos los usuarios)  
✅ **Acceso directo en Escritorio**  
✅ **Acceso directo en Menú Inicio**  
✅ **Carpeta en Menú Inicio** con:
   - SkyLab.lnk
   - Desinstalar SkyLab.lnk  
✅ **Desinstalador en Programas y Características**  
✅ **Interfaz en Español**  
✅ **Opción de cambiar directorio de instalación**  
✅ **Ejecutar al finalizar instalación**  

---

## 🗑️ Desinstalar

### Opción 1: Panel de Control
```
Panel de Control → Programas y Características → SkyLab → Desinstalar
```

### Opción 2: Menú Inicio
```
Menú Inicio → SkyLab → Desinstalar SkyLab
```

**Pregunta antes de eliminar datos de usuario** ✅

---

## 🤖 Build Automático (GitHub Actions)

### Ver Builds

1. Ve a: https://github.com/Labit-Group/skylab-electron/actions
2. Click en "**Build Windows**"
3. Selecciona el último workflow exitoso
4. Descarga artifacts:
   - `skylab-windows-x64-installer`
   - `skylab-windows-ia32-installer`
   - `skylab-windows-arm64-installer`
   - `skylab-windows-portable`

### Ejecutar Manualmente

1. Ve a: https://github.com/Labit-Group/skylab-electron/actions
2. Click "**Build Windows**"
3. Click "**Run workflow**" → "**main**" → "**Run workflow**"
4. Espera ~5 minutos
5. Descarga artifacts

---

## 📊 Tiempos de Build

| Build | Tiempo | Output |
|-------|--------|--------|
| **Local (todas)** | ~3-5 min | 4 archivos |
| **Local (x64 solo)** | ~1-2 min | 2 archivos |
| **GitHub Actions** | ~5-7 min | 4 archivos |

---

## ✅ Verificar Instalación

### Después de Instalar

```powershell
# Verificar archivos instalados
dir "C:\Program Files\SkyLab\"

# Verificar acceso directo del escritorio
dir "$env:USERPROFILE\Desktop\SkyLab.lnk"

# Verificar en Menú Inicio
dir "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\SkyLab\"

# Verificar en registro
reg query "HKLM\Software\Labit\SkyLab"
```

### Ejecutar

```powershell
# Desde instalación
& "C:\Program Files\SkyLab\SkyLab.exe"

# Desde acceso directo
start "$env:USERPROFILE\Desktop\SkyLab.lnk"
```

---

## 🔄 Actualizar Versión

```bash
# 1. Actualizar versión en package.json
vim package.json
# "version": "0.1.2"

# 2. Rebuild
npm run dist:win

# 3. Nuevos archivos
ls release-builds/
# SkyLab-Setup-0.1.2-x64.exe
```

**Usuarios finales:**
1. Desinstalar versión anterior
2. Instalar nueva versión

---

## 🎨 Personalización

### Cambiar Icono

```bash
# Reemplaza el icono
cp nuevo-icono.ico assets/icons/win/icon.ico

# Rebuild
npm run dist:win
```

### Cambiar Nombre de Acceso Directo

```json
// package.json
{
  "nsis": {
    "shortcutName": "Mi Aplicación"
  }
}
```

### Cambiar Directorio por Defecto

```json
{
  "nsis": {
    "installerDirectory": "C:\\MiEmpresa\\SkyLab"
  }
}
```

---

## 🐛 Problemas Comunes

### Build Falla con "Cannot find icon"

```bash
# Verificar icono existe
ls assets/icons/win/icon.ico

# Si no existe, crear uno o usar icono por defecto
```

### Instalador Detectado como Malware

✅ **Normal** para instaladores sin firmar.

**Solución:**
1. Ignorar advertencia (uso interno)
2. O firmar con certificado (uso público)

### Error "EPERM: operation not permitted"

```bash
# Cerrar SkyLab si está ejecutándose
# Luego rebuild
npm run dist:win
```

---

## 📋 Checklist Pre-Release

```bash
# ✅ Versión actualizada en package.json
# ✅ Icono correcto en assets/icons/win/icon.ico
# ✅ Build exitoso (sin errores)
# ✅ Instalador probado en Windows
# ✅ Instalación en Program Files funciona
# ✅ Accesos directos funcionan
# ✅ Aplicación se ejecuta correctamente
# ✅ Desinstalación funciona
```

---

## 🎯 Para Distribución Interna

**Comparte solo:**
```
SkyLab-Setup-0.1.1-x64.exe  (85 MB)
```

**Instrucciones para usuarios:**
```
1. Ejecutar SkyLab-Setup-0.1.1-x64.exe
2. Aceptar permisos (UAC)
3. Siguiente → Instalar
4. ¡Listo! Buscar "SkyLab" en el Menú Inicio
```

---

## 🚀 Próximos Pasos

### Opcional: Firma Digital

```bash
# Requiere certificado Code Signing (~$200/año)
npm install --save-dev electron-windows-store
```

### Opcional: Auto-Update

```bash
# Actualización automática
npm install electron-updater
```

---

**¿Listo para generar tu primer instalador?** 🎉

```bash
npm run dist:win:x64
```
