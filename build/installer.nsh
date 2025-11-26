; ========================================
; Script de Instalación Personalizado NSIS
; SkyLab - Labit Group
; ========================================

; Macros de instalación personalizada
!macro customInstall
  ; Crear accesos directos adicionales
  CreateShortCut "$DESKTOP\SkyLab.lnk" "$INSTDIR\${PRODUCT_FILENAME}.exe" "" "$INSTDIR\${PRODUCT_FILENAME}.exe" 0
  CreateDirectory "$SMPROGRAMS\SkyLab"
  CreateShortCut "$SMPROGRAMS\SkyLab\SkyLab.lnk" "$INSTDIR\${PRODUCT_FILENAME}.exe" "" "$INSTDIR\${PRODUCT_FILENAME}.exe" 0
  CreateShortCut "$SMPROGRAMS\SkyLab\Desinstalar SkyLab.lnk" "$INSTDIR\Uninstall ${PRODUCT_FILENAME}.exe"
  
  ; Crear carpeta de datos de usuario si no existe
  CreateDirectory "$APPDATA\SkyLab"
  
  ; Agregar al registro para "Programas y características"
  WriteRegStr HKLM "Software\Labit\SkyLab" "InstallPath" "$INSTDIR"
  WriteRegStr HKLM "Software\Labit\SkyLab" "Version" "${VERSION}"
!macroend

; Macros de desinstalación personalizada
!macro customUnInstall
  ; Eliminar accesos directos
  Delete "$DESKTOP\SkyLab.lnk"
  Delete "$SMPROGRAMS\SkyLab\SkyLab.lnk"
  Delete "$SMPROGRAMS\SkyLab\Desinstalar SkyLab.lnk"
  RMDir "$SMPROGRAMS\SkyLab"
  
  ; Limpiar registro
  DeleteRegKey HKLM "Software\Labit\SkyLab"
  
  ; Preguntar si desea eliminar datos de usuario
  MessageBox MB_YESNO "¿Desea eliminar también los datos de la aplicación?" IDYES DeleteAppData IDNO KeepAppData
  DeleteAppData:
    RMDir /r "$APPDATA\SkyLab"
  KeepAppData:
!macroend

; Texto de la página de bienvenida
!macro customWelcomePage
  !define MUI_WELCOMEPAGE_TITLE "Bienvenido al Instalador de SkyLab"
  !define MUI_WELCOMEPAGE_TEXT "Este asistente le guiará en la instalación de SkyLab.$\r$\n$\r$\nSkyLab se instalará en Program Files y se crearán accesos directos en el Escritorio y el Menú Inicio.$\r$\n$\r$\nHaga clic en Siguiente para continuar."
!macroend

; Página de finalización personalizada
!macro customFinishPage
  !define MUI_FINISHPAGE_TITLE "Instalación Completada"
  !define MUI_FINISHPAGE_TEXT "SkyLab se ha instalado correctamente en su equipo.$\r$\n$\r$\nPuede iniciar la aplicación desde:$\r$\n  • El acceso directo del Escritorio$\r$\n  • El Menú Inicio$\r$\n  • El directorio de instalación"
  !define MUI_FINISHPAGE_RUN "$INSTDIR\${PRODUCT_FILENAME}.exe"
  !define MUI_FINISHPAGE_RUN_TEXT "Iniciar SkyLab ahora"
!macroend
