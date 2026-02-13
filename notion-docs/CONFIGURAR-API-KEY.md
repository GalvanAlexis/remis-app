# 🎯 Ubicación Exacta y Configuración Manual

## 📍 Archivo a Editar

**Abre este archivo con un editor de texto:**

```
C:\Users\PC Blado\AppData\Roaming\Code\User\mcp.json
```

---

## 📝 Contenido Actual del Archivo

Actualmente tu archivo tiene esto:

```json
{
  "servers": {
    "MCP_DOCKER": {
      "command": "docker",
      "args": ["mcp", "gateway", "run"],
      "env": {
        "LOCALAPPDATA": "C:\\Users\\PC Blado\\AppData\\Local",
        "ProgramData": "C:\\ProgramData",
        "ProgramFiles": "C:\\Program Files"
      },
      "type": "stdio"
    }
  }
}
```

---

## ✅ Contenido NUEVO (con Notion configurado)

**REEMPLAZA todo el contenido** del archivo con esto:

```json
{
  "servers": {
    "MCP_DOCKER": {
      "command": "docker",
      "args": ["mcp", "gateway", "run"],
      "env": {
        "LOCALAPPDATA": "C:\\Users\\PC Blado\\AppData\\Local",
        "ProgramData": "C:\\ProgramData",
        "ProgramFiles": "C:\\Program Files"
      },
      "type": "stdio"
    },
    "notion-mcp-server": {
      "command": "npx",
      "args": ["-y", "@notionhq/mcp-server-notion"],
      "env": {
        "NOTION_API_KEY": "PEGA_TU_KEY_AQUI"
      }
    }
  }
}
```

---

## 🔑 Pasos Exactos

### 1. Abrir el Archivo

- Presiona `Win + R`
- Pega esto: `notepad "C:\Users\PC Blado\AppData\Roaming\Code\User\mcp.json"`
- Presiona Enter

### 2. Editar

- **Copia** el contenido NUEVO de arriba
- **PEGA** y reemplaza todo en el archivo
- Donde dice `"PEGA_TU_KEY_AQUI"`, **reemplázalo** con tu nueva API key de Notion (mantén las comillas)

Ejemplo de cómo debería verse:

```json
"NOTION_API_KEY": "secret_ABC123XYZ456..."
```

### 3. Guardar

- `Ctrl + S` para guardar
- Cierra el Notepad

### 4. Reiniciar Antigravity

- Cierra **completamente** Antigravity
- Vuelve a abrirlo
- Espera a que cargue totalmente

### 5. Probar

- Vuelve a esta conversación
- Pégame el URL de tu página de Notion
- Debería funcionar inmediatamente

---

## ⚠️ IMPORTANTE

- **Mantén las comillas** alrededor de la key
- **No agregues espacios** extra
- **Guarda** antes de cerrar el editor
- **Reinicia completamente** Antigravity (no solo recarga)

---

## 🔍 Si No Funciona

Revisa que:

1. La key comience con `secret_`
2. Las comillas estén correctas: `"secret_..."`
3. No haya comas faltantes o extra
4. El archivo JSON sea válido (puedes usar jsonlint.com)

---

**¿Listo? Edita el archivo, reinicia Antigravity, y pégame el URL de la página para probarlo.**
