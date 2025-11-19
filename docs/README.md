# Configuración para Builds macOS Apple Silicon

Este directorio contiene la documentación y configuración necesaria para generar builds de SkyLab optimizados para macOS Apple Silicon (M1/M2/M3).

## 📄 Documentos Disponibles

### 1. [README_APPLE_SILICON.md](../README_APPLE_SILICON.md) 🚀
**Inicio rápido y resumen ejecutivo**
- Comandos rápidos para compilar builds arm64/universal
- Scripts disponibles
- Verificación de arquitectura
- Troubleshooting básico
- **📍 EMPIEZA AQUÍ**

### 2. [QUICKSTART.md](../QUICKSTART.md) ⚡
**Checklist operativo paso a paso**
- Comandos listos para copiar y pegar
- Workflow completo desde instalación hasta verificación
- Instrucciones específicas para Linux vs macOS
- Configuración de GitHub Actions
- **📍 PARA EJECUTAR AHORA MISMO**

### 3. [CODESIGN_NOTARIZE.md](CODESIGN_NOTARIZE.md) 🔐
**Guía completa de firma digital y notarización**
- Requisitos y certificados Apple
- Configuración de credenciales (App-Specific Password / API Key)
- Firma manual con `codesign`
- Notarización con `notarytool`
- Configuración de GitHub Actions
- Problemas comunes y soluciones

### 4. [VERIFICATION_CHECKLIST.md](VERIFICATION_CHECKLIST.md) ✅
**Checklist paso a paso para verificación local**
- Comandos de compilación
- Verificación de arquitectura con `file` y `lipo`
- Tests de ejecución y rendimiento
- Verificación en Activity Monitor
- Validación de firma y notarización
- Benchmarks de CPU/GPU/Memoria

### 5. [ALTERNATIVE_CONFIGS.md](ALTERNATIVE_CONFIGS.md) 🔧
**Configuraciones alternativas y mejores prácticas**
- Comparación de estrategias de build (universal vs separados)
- Opciones de CI/CD
- Configuraciones de entitlements según caso de uso
- Métodos de notarización
- Optimizaciones de tamaño y performance
- Debugging avanzado

## 🎯 Flujo Recomendado

```
1. Lee: README_APPLE_SILICON.md
   ↓ (entender qué se configuró)

2. Ejecuta: QUICKSTART.md
   ↓ (hacer commit y push)

3. Verifica: VERIFICATION_CHECKLIST.md
   ↓ (probar builds en Mac)

4. (Opcional) Configura: CODESIGN_NOTARIZE.md
   ↓ (para distribución pública)

5. (Avanzado) Optimiza: ALTERNATIVE_CONFIGS.md
   ↓ (ajustes finos según necesidades)
```

## 🚀 Inicio Rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Build universal (Intel + Apple Silicon)
npm run build:mac:universal

# 3. Verificar arquitectura
lipo -info release-builds/mac-universal/SkyLab.app/Contents/MacOS/SkyLab
```

## 📁 Estructura

```
docs/
├── README.md (este archivo)
├── CODESIGN_NOTARIZE.md       # Guía de firma y notarización
├── VERIFICATION_CHECKLIST.md  # Checklist de verificación
└── ALTERNATIVE_CONFIGS.md     # Configs alternativas y mejores prácticas

build/
└── entitlements.mac.plist     # Permisos de macOS (Hardened Runtime)

.github/workflows/
└── build-mac.yml              # CI/CD para macOS

README_APPLE_SILICON.md        # Resumen ejecutivo
QUICKSTART.md                  # Comandos para ejecutar ahora
```

## 📚 Resumen de Configuración Actual

### Scripts en package.json
```bash
npm run build:mac:x64        # Build solo Intel
npm run build:mac:arm64      # Build solo Apple Silicon
npm run build:mac:universal  # Build Universal (ambos)
npm run rebuild:x64          # Recompilar módulos nativos x64
npm run rebuild:arm64        # Recompilar módulos nativos arm64
```

### GitHub Actions
- **Workflow**: `.github/workflows/build-mac.yml`
- **Runners**: macOS-13 (Intel), macOS-14 (Apple Silicon)
- **Artefactos**: Builds separados + universal
- **Triggers**: Push a main, PRs, manual

### Configuración electron-builder
- **Target**: DMG + ZIP
- **Arch**: Universal (x64 + arm64)
- **Firma**: Configurada (requiere secrets)
- **Notarización**: Lista para activar

## 🔗 Enlaces Útiles

### Documentación
- [Electron Documentation](https://www.electronjs.org/docs)
- [electron-builder](https://www.electron.build)
- [Electron on Apple Silicon](https://www.electronjs.org/docs/latest/tutorial/apple-silicon)

### Apple Developer
- [Developer Portal](https://developer.apple.com)
- [Notarization Guide](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [Code Signing](https://developer.apple.com/support/code-signing/)

### GitHub
- [Actions Documentation](https://docs.github.com/en/actions)
- [macOS Runners](https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners#supported-runners-and-hardware-resources)

## ❓ FAQ

### ¿Necesito un Mac para compilar?
**No**, puedes usar GitHub Actions (incluido en el proyecto). Pero sí necesitas un Mac para **probar** los builds.

### ¿Necesito Apple Developer Account?
- **Para desarrollo/testing**: No
- **Para distribución pública**: Sí (firma y notarización)

### ¿Qué es un build "universal"?
Un binario que contiene código para **x64 e arm64**, ejecutándose nativamente en ambas plataformas sin Rosetta.

### ¿Por qué mi build es grande?
Los builds universales son ~2x el tamaño porque incluyen ambas arquitecturas. Considera distribuir builds separados si el tamaño es crítico.

### ¿Cómo sé si está funcionando nativamente?
```bash
PID=$(pgrep -f "SkyLab")
sysctl -n sysctl.proc_translated.$PID
# 0 = nativo ✅ | 1 = Rosetta ❌
```

### ¿Qué hago si falla electron-rebuild?
```bash
rm -rf node_modules
npm install
npm run rebuild:arm64  # o la arquitectura que necesites
```

## 🆘 Soporte

### Problemas Comunes
Ver `VERIFICATION_CHECKLIST.md` → Sección "Troubleshooting"

### Documentación Detallada
Cada documento tiene su propia sección de troubleshooting y referencias.

### Issues de GitHub
Para bugs o preguntas: [github.com/Labit-Group/skylab-electron/issues](https://github.com/Labit-Group/skylab-electron/issues)

---

**Última actualización**: Noviembre 2025  
**Versión de Electron**: 35.7.5  
**Autor**: Francisco Ortega Iglesias  
**Organización**: Labit Group

---

¡Toda la documentación que necesitas para builds nativos de Apple Silicon! 🚀
