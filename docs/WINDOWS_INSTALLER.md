# 🪟 Instalador Windows - SkyLab

## 📦 Tipos de Instaladores

### 1. **NSIS Installer** (Recomendado)
- ✅ Instalación en **Program Files**
- ✅ Acceso directo en **Escritorio**
- ✅ Acceso directo en **Menú Inicio**
- ✅ Desinstalador en **Programas y características**
- ✅ Instalación por máquina (todos los usuarios)
- ✅ Soporte multilenguaje (Español/Inglés)

### 2. **Portable** (Sin instalación)
- ✅ Ejecutable único
- ✅ No requiere instalación
- ✅ Solo x64

---

## 🏗️ Arquitecturas Soportadas

| Arquitectura | Target | Uso |
|--------------|--------|-----|
| **x64** | `--x64` | PCs modernas (64-bit) - **Más común** ⭐ |
| **ia32** | `--ia32` | PCs antiguas (32-bit) |
| **arm64** | `--arm64` | Windows on ARM (Surface Pro X, etc.) |

---

## 🚀 Comandos de Build

### Build Todas las Arquitecturas

```bash
# NSIS Installers para todas las arquitecturas
npm run dist:win

# Genera:
# ✅ SkyLab-Setup-0.1.1-x64.exe
# ✅ SkyLab-Setup-0.1.1-ia32.exe
# ✅ SkyLab-Setup-0.1.1-arm64.exe
# ✅ SkyLab-0.1.1-x64.exe (Portable)
```

### Build por Arquitectura Individual

```bash
# Solo x64 (más común)
npm run dist:win:x64

# Solo ia32 (PCs antiguas)
npm run dist:win:ia32

# Solo arm64 (Windows on ARM)
npm run dist:win:arm64
```

---

## 📋 Configuración del Instalador

### Características NSIS

```json
{
  "nsis": {
    "oneClick": false,              // Instalador asistido (no one-click)
    "perMachine": true,             // Instalación para todos los usuarios
    "allowElevation": true,         // Solicitar permisos de administrador
    "allowToChangeInstallationDirectory": true,
    "installerIcon": "icon.ico",
    "createDesktopShortcut": true,  // ✅ Acceso directo en Escritorio
    "createStartMenuShortcut": true,// ✅ Acceso directo en Menú Inicio
    "shortcutName": "SkyLab",
    "runAfterFinish": true,         // Ejecutar después de instalar
    "menuCategory": true,           // Crear categoría en Menú Inicio
    "language": "es_ES"             // Idioma Español
  }
}
```

### Ubicaciones de Instalación

| Elemento | Ubicación por Defecto |
|----------|----------------------|
| **Aplicación** | `C:\Program Files\SkyLab\` |
| **Escritorio** | `C:\Users\[Usuario]\Desktop\SkyLab.lnk` |
| **Menú Inicio** | `C:\ProgramData\Microsoft\Windows\Start Menu\Programs\SkyLab\` |
| **Datos de Usuario** | `C:\Users\[Usuario]\AppData\Roaming\SkyLab\` |
| **Desinstalador** | Panel de Control → Programas y Características |

---

## 🎯 Proceso de Instalación

### Pasos del Usuario

1. **Ejecutar** `SkyLab-Setup-0.1.1-x64.exe`
2. **Aceptar** UAC (Control de Cuentas de Usuario)
3. **Seleccionar** directorio de instalación (opcional)
   - Default: `C:\Program Files\SkyLab`
4. **Esperar** instalación (~10 segundos)
5. **Finalizar** y ejecutar (opcional)

### Lo que Hace el Instalador

```
1. Solicitar permisos de administrador
2. Crear C:\Program Files\SkyLab\
3. Copiar archivos de la aplicación
4. Crear acceso directo en Escritorio
5. Crear carpeta en Menú Inicio
   ├── SkyLab.lnk
   └── Desinstalar SkyLab.lnk
6. Registrar en "Programas y características"
7. Crear directorio de datos de usuario
8. Ejecutar SkyLab (si se selecciona)
```

---

## 🗑️ Desinstalación

### Métodos

**Método 1: Panel de Control**
```
Panel de Control → Programas → Programas y características
→ Buscar "SkyLab" → Desinstalar
```

**Método 2: Menú Inicio**
```
Menú Inicio → SkyLab → Desinstalar SkyLab
```

**Método 3: Directorio de Instalación**
```
C:\Program Files\SkyLab\Uninstall SkyLab.exe
```

### Lo que Elimina

- ✅ Archivos de `C:\Program Files\SkyLab\`
- ✅ Acceso directo del Escritorio
- ✅ Carpeta del Menú Inicio
- ✅ Entradas del registro
- ❓ **Datos de usuario** (pregunta antes de eliminar)

---

## 📊 Tamaños de los Instaladores

```
NSIS Installers (comprimidos):
├── SkyLab-Setup-0.1.1-x64.exe      ~85 MB   ⭐ Recomendado
├── SkyLab-Setup-0.1.1-ia32.exe     ~80 MB
└── SkyLab-Setup-0.1.1-arm64.exe    ~85 MB

Portable:
└── SkyLab-0.1.1-x64.exe            ~150 MB  (sin comprimir)

Instalado en disco:
└── C:\Program Files\SkyLab\        ~200 MB
```

---

## 🔧 Personalización Avanzada

### Script NSIS Personalizado

Ubicación: `build/installer.nsh`

**Características:**
- ✅ Mensajes en español
- ✅ Páginas de bienvenida personalizadas
- ✅ Creación de carpeta de datos
- ✅ Registro en Windows Registry
- ✅ Pregunta antes de eliminar datos de usuario

### Modificar Directorio por Defecto

```json
{
  "nsis": {
    "installerDirectory": "C:\\MiEmpresa\\SkyLab"
  }
}
```

### Agregar Más Accesos Directos

Edita `build/installer.nsh`:

```nsis
CreateShortCut "$QUICKLAUNCH\SkyLab.lnk" "$INSTDIR\${PRODUCT_FILENAME}.exe"
```

---

## 🎨 Iconos del Instalador

```
assets/icons/win/
└── icon.ico                        → Icono principal

Usado en:
├── Instalador (cabecera)
├── Aplicación instalada
├── Accesos directos
└── Desinstalador
```

**Recomendaciones:**
- Formato: `.ico`
- Tamaños: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256
- Fondo transparente

---

## 🚀 GitHub Actions (CI/CD)

### Workflow Automático

Crea `.github/workflows/build-windows.yml`:

```yaml
name: Build Windows

on:
  push:
    branches: [ main ]
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  build:
    runs-on: windows-latest
    
    strategy:
      matrix:
        arch: [x64, ia32, arm64]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build Windows ${{ matrix.arch }}
        run: npm run dist:win:${{ matrix.arch }}
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: skylab-windows-${{ matrix.arch }}
          path: |
            release-builds/*.exe
          retention-days: 30
```

---

## 📦 Distribución

### Recomendaciones por Escenario

| Escenario | Distribución | Arquitectura |
|-----------|--------------|--------------|
| **Empresa moderna** | NSIS x64 | x64 |
| **Empresa mixta** | NSIS x64 + ia32 | x64, ia32 |
| **Equipos Surface** | NSIS arm64 | arm64 |
| **USB/Portable** | Portable x64 | x64 |
| **Máxima compatibilidad** | Todas | x64, ia32, arm64 |

### Nombres de Archivo

```
SkyLab-Setup-0.1.1-x64.exe      → Para PCs 64-bit (99% de casos)
SkyLab-Setup-0.1.1-ia32.exe     → Para PCs 32-bit (PCs viejas)
SkyLab-Setup-0.1.1-arm64.exe    → Para Windows on ARM
SkyLab-0.1.1-x64.exe            → Portable (sin instalación)
```

---

## ✅ Checklist de Release

```bash
# 1. Actualizar versión
vim package.json  # version: "0.1.2"

# 2. Build todas las arquitecturas
npm run dist:win

# 3. Verificar archivos generados
ls -lh release-builds/

# 4. Probar instalador
# - Ejecutar en máquina virtual Windows
# - Verificar instalación en Program Files
# - Verificar accesos directos
# - Verificar desinstalación

# 5. Distribuir
# - Subir a GitHub Releases
# - Compartir con equipo
# - Actualizar documentación
```

---

## 🐛 Troubleshooting

### Error: "Cannot find module 'electron-builder'"

```bash
npm install --save-dev electron-builder
```

### Error: Instalador requiere permisos de administrador

✅ **Esto es normal**. `perMachine: true` requiere permisos para instalar en Program Files.

**Solución para instalar sin admin:**
```json
{
  "nsis": {
    "perMachine": false  // Instala en AppData\Local
  }
}
```

### Icono no aparece en el instalador

```bash
# Verificar que existe
ls -l assets/icons/win/icon.ico

# Regenerar build
npm run dist:win
```

### Instalador en inglés en vez de español

```json
{
  "nsis": {
    "language": "es_ES",
    "installerLanguages": ["es_ES"]
  }
}
```

---

## 📊 Comparación con Otros Instaladores

| Característica | NSIS | Squirrel | MSI |
|----------------|------|----------|-----|
| **Tamaño** | Pequeño | Medio | Grande |
| **Personalización** | ✅ Alta | ⚠️ Media | ✅ Alta |
| **Auto-update** | ⚠️ Manual | ✅ Integrado | ❌ No |
| **Program Files** | ✅ Sí | ⚠️ AppData | ✅ Sí |
| **Accesos directos** | ✅ Sí | ✅ Sí | ✅ Sí |
| **Desinstalador** | ✅ Completo | ✅ Básico | ✅ Completo |
| **Firma digital** | ✅ Soportado | ✅ Soportado | ✅ Soportado |

**Recomendación**: NSIS para tu caso ✅

---

## 🎯 Próximos Pasos Opcionales

### 1. Firma Digital (Code Signing)

```json
{
  "win": {
    "certificateFile": "path/to/cert.pfx",
    "certificatePassword": "password",
    "signingHashAlgorithms": ["sha256"],
    "signDlls": true
  }
}
```

### 2. Auto-Update

```bash
npm install electron-updater

# Configurar en package.json
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

### 3. Multi-Idioma

Agrega más idiomas al instalador:

```json
{
  "nsis": {
    "installerLanguages": ["es_ES", "en_US", "fr_FR", "de_DE"]
  }
}
```

---

## 📚 Recursos

- [electron-builder NSIS](https://www.electron.build/configuration/nsis)
- [NSIS Documentation](https://nsis.sourceforge.io/Docs/)
- [Windows Code Signing](https://docs.microsoft.com/en-us/windows/win32/seccrypto/cryptography-tools)

---

**¡Listo para distribuir!** 🚀

Tu instalador ahora:
- ✅ Instala en Program Files
- ✅ Crea accesos directos
- ✅ Soporta todas las arquitecturas Windows
- ✅ Interfaz en español
- ✅ Desinstalación completa
