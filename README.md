# 🚀 SkyLab - Aplicación Electron

[![Electron](https://img.shields.io/badge/Electron-35.7.5-blue.svg)](https://www.electronjs.org/)
[![Node](https://img.shields.io/badge/Node-18%2B-green.svg)](https://nodejs.org/)
[![macOS](https://img.shields.io/badge/macOS-Apple%20Silicon%20Ready-purple.svg)](https://www.apple.com/mac/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()

Aplicación de escritorio multiplataforma para SkyLab by Labit Group.

## ✨ Características

- 🌐 Cliente web empaquetado con Electron
- 📥 Sistema de descargas integrado con barra de progreso
- 🔍 Zoom configurable y persistente
- 🎨 Menús contextuales personalizados
- 💾 Almacenamiento local con electron-store
- 🍎 **Soporte nativo para Apple Silicon (M1/M2/M3)**
- 🪟 Builds para Windows, macOS y Linux

## 🏗️ Arquitecturas Soportadas

| Plataforma | Arquitecturas | Status |
|------------|---------------|--------|
| **macOS** | x64, arm64, universal | ✅ Nativo |
| **Windows** | x64 | ✅ |
| **Linux** | x64, AppImage | ✅ |

## 🚀 Inicio Rápido

### Requisitos

- Node.js 18+ o 20+
- npm 8+
- macOS (para compilar builds de macOS)

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/Labit-Group/skylab-electron.git
cd skylab-electron

# Instalar dependencias
npm install
```

### Desarrollo

```bash
# Ejecutar en modo desarrollo
npm start
```

### Compilar

```bash
# Windows
npm run dist:win

# macOS (arquitectura del sistema)
npm run dist:mac

# macOS Intel específico
npm run build:mac:x64

# macOS Apple Silicon específico
npm run build:mac:arm64

# macOS Universal (Intel + Apple Silicon) ⭐
npm run build:mac:universal

# Linux
npm run dist:linux
```

Los builds generados estarán en `release-builds/`

## 🍎 Builds para Apple Silicon

Este proyecto está completamente configurado para generar builds nativos de macOS optimizados para Apple Silicon.

### 📚 Documentación Completa

- **[QUICKSTART.md](QUICKSTART.md)** - Comandos para empezar ahora mismo ⚡
- **[README_APPLE_SILICON.md](README_APPLE_SILICON.md)** - Resumen ejecutivo
- **[VISUAL_SUMMARY.md](VISUAL_SUMMARY.md)** - Resumen visual con diagramas
- **[docs/](docs/)** - Documentación detallada completa

### ⚡ Comandos Rápidos

```bash
# Recompilar módulos nativos para Apple Silicon
npm run rebuild:arm64

# Build universal (funciona en Intel y M1/M2/M3)
npm run build:mac:universal

# Verificar arquitectura del build
lipo -info release-builds/mac-universal/SkyLab.app/Contents/MacOS/SkyLab
```

### 🤖 CI/CD Automático

GitHub Actions compila automáticamente builds para todas las arquitecturas en cada push:

- ✅ macOS x64 (Intel)
- ✅ macOS arm64 (Apple Silicon)
- ✅ macOS universal (ambos)

Ver: [`.github/workflows/build-mac.yml`](.github/workflows/build-mac.yml)

## 📦 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm start` | Ejecutar en modo desarrollo |
| `npm run dist` | Build para la plataforma actual |
| `npm run dist:win` | Build para Windows |
| `npm run dist:mac` | Build para macOS (arch del sistema) |
| `npm run dist:linux` | Build para Linux |
| `npm run build:mac:x64` | Build macOS Intel |
| `npm run build:mac:arm64` | Build macOS Apple Silicon |
| `npm run build:mac:universal` | Build macOS Universal |
| `npm run rebuild:x64` | Recompilar módulos nativos x64 |
| `npm run rebuild:arm64` | Recompilar módulos nativos arm64 |

## 🔧 Tecnologías

- **Electron** 35.7.5 - Framework multiplataforma
- **electron-builder** - Empaquetado y distribución
- **electron-store** - Almacenamiento persistente
- **electron-context-menu** - Menús contextuales
- **electron-rebuild** - Recompilación de módulos nativos

## 📁 Estructura del Proyecto

```
skylab-electron/
├── main.js                     # Proceso principal de Electron
├── preload.js                  # Script de preload
├── renderer.js                 # Proceso renderer
├── package.json                # Configuración del proyecto
├── .github/workflows/          # CI/CD con GitHub Actions
│   └── build-mac.yml           # Workflow de builds macOS
├── assets/                     # Recursos (iconos, etc.)
├── build/                      # Configuración de build
│   └── entitlements.mac.plist  # Permisos macOS
├── docs/                       # Documentación completa
├── downloadProgress/           # UI de descarga
├── release-builds/             # Builds generados (git-ignored)
└── scripts/                    # Scripts de utilidad
    └── notarize.js             # Script de notarización
```

## 🔐 Firma Digital y Notarización (macOS)

Para distribuir la aplicación públicamente en macOS, necesitas:

1. **Apple Developer Account** ($99/año)
2. **Certificado "Developer ID Application"**
3. **Configurar credenciales** para notarización

Ver guía completa: **[docs/CODESIGN_NOTARIZE.md](docs/CODESIGN_NOTARIZE.md)**

### Configuración Rápida

```bash
# 1. Copiar ejemplo de configuración
cp .env.local.example .env.local

# 2. Editar .env.local con tus credenciales
# (Ver docs/CODESIGN_NOTARIZE.md para obtenerlas)

# 3. Cargar variables
source .env.local

# 4. Build + Firma + Notarización automática
npm run build:mac:universal
```

## 🧪 Verificación de Builds

### Verificar Arquitectura

```bash
# Ver tipo de archivo
file release-builds/mac-universal/SkyLab.app/Contents/MacOS/SkyLab

# Ver arquitecturas incluidas (debe mostrar: x86_64 arm64)
lipo -info release-builds/mac-universal/SkyLab.app/Contents/MacOS/SkyLab
```

### Verificar Ejecución Nativa (en Mac M1/M2/M3)

```bash
# Ejecutar la app
open release-builds/mac-universal/SkyLab.app

# Obtener PID del proceso
PID=$(pgrep -f "SkyLab")

# Verificar si usa Rosetta
sysctl -n sysctl.proc_translated.$PID
# Resultado: 0 = nativo ✅ | 1 = Rosetta ❌
```

Checklist completo: **[docs/VERIFICATION_CHECKLIST.md](docs/VERIFICATION_CHECKLIST.md)**

## 🐛 Troubleshooting

### Error: "Module did not self-register"

```bash
# Solución: Recompilar módulos nativos
rm -rf node_modules
npm install
npm run rebuild:arm64  # o rebuild:x64
```

### Build Universal Falla

```bash
# Debe compilarse en macOS
# Recompilar para ambas arquitecturas:
npm run rebuild:x64
npm run rebuild:arm64
npm run build:mac:universal
```

### App se Ejecuta en Rosetta (Activity Monitor muestra "Intel")

```bash
# Verificar que el binario sea arm64 o universal
lipo -info release-builds/mac-universal/SkyLab.app/Contents/MacOS/SkyLab

# Si solo muestra x86_64, recompilar:
npm run build:mac:arm64
```

Más soluciones: **[docs/VERIFICATION_CHECKLIST.md](docs/VERIFICATION_CHECKLIST.md)** (sección Troubleshooting)

## 📚 Documentación Adicional

| Documento | Descripción |
|-----------|-------------|
| [QUICKSTART.md](QUICKSTART.md) | Comandos para ejecutar ahora |
| [VISUAL_SUMMARY.md](VISUAL_SUMMARY.md) | Resumen visual con diagramas |
| [README_APPLE_SILICON.md](README_APPLE_SILICON.md) | Guía completa Apple Silicon |
| [docs/CODESIGN_NOTARIZE.md](docs/CODESIGN_NOTARIZE.md) | Firma y notarización |
| [docs/VERIFICATION_CHECKLIST.md](docs/VERIFICATION_CHECKLIST.md) | Checklist de verificación |
| [docs/ALTERNATIVE_CONFIGS.md](docs/ALTERNATIVE_CONFIGS.md) | Configuraciones avanzadas |

## 🤝 Contribuir

Este es un proyecto privado de Labit Group. Para contribuir:

1. Crear un branch desde `main`
2. Hacer cambios y commits
3. Crear Pull Request
4. Esperar revisión

## 📝 Changelog

### v0.1.1 (Actual)
- ✅ Soporte completo para Apple Silicon (arm64)
- ✅ Builds universales (x64 + arm64)
- ✅ CI/CD con GitHub Actions
- ✅ Configuración de firma y notarización
- ✅ Documentación completa

### v0.1.0
- Versión inicial
- Soporte para Windows, macOS Intel y Linux

## 👥 Equipo

- **Desarrollador**: Francisco Ortega Iglesias
- **Organización**: Labit Group

## 📄 Licencia

Copyright © 2025 Labit Group. Todos los derechos reservados.

---

## 🎯 Próximos Pasos

### Para Desarrollo Local:

1. ✅ Instalar dependencias: `npm install`
2. ✅ Ejecutar en dev: `npm start`
3. ✅ Compilar build de prueba: `npm run build:mac:arm64`

### Para Distribución:

1. ⚙️ Obtener certificado de Apple Developer
2. ⚙️ Configurar credenciales (ver `docs/CODESIGN_NOTARIZE.md`)
3. ⚙️ Configurar GitHub Secrets
4. 🚀 Push a main → Build automático + Notarización

### Para Contribuir:

1. 🔀 Crear branch
2. ✏️ Hacer cambios
3. ✅ Verificar con checklist
4. 📤 Pull Request

---

**¿Preguntas?** Consulta la [documentación completa](docs/) o abre un issue.

**¿Listo para compilar?** Lee [QUICKSTART.md](QUICKSTART.md) y empieza ahora! 🚀
