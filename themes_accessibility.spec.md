# OpenSpec: Sistema de Temas Visuales e Identidad Adaptada (45+ Friendly)

## 1. Visión General
Este sistema garantiza que la aplicación Remis sea accesible y estéticamente premium para su público objetivo principal (usuarios mayores de 45 años). Se basa en tres pilares: **Legibilidad, Contraste y Usabilidad Táctil**.

## 2. Definición Técnica de la Verdad (SDD)

### 2.1 Paleta de Temas (Design Tokens)

| Token | Ejecutivo (Moderno/Serio) | Noir (Alto Contraste) | Legado (Clásico/Elegante) |
| :--- | :--- | :--- | :--- |
| **Primary** | #1A237E (Navy Blue) | #03DAC6 (Teal) | #4E0B0B (Burgundy) |
| **Secondary** | #C5A059 (Gold metallic) | #CFD8DC (Silver/Grey) | #212121 (Soft Black) |
| **Background** | #F8F9FA (Off-White) | #121212 (True Black) | #F5F5DC (Cream/Beige) |
| **Surface** | #FFFFFF | #1E1E1E | #FFFBF0 |
| **Text (On Surface)** | #121212 | #FFFFFF | #212121 |

### 2.2 Tipografía y Espaciado (45+ Stats)
- **Tamaño Base (Body):** 16px (mínimo absoluto).
- **Encabezados (Headlines):** 24px - 32px (Font-weight: 700).
- **Line Height:** 1.5x (para reducir fatiga visual).
- **Font-Family:** Inter o Roboto (San Serif de alta legibilidad).

### 2.3 Usabilidad Táctil (HIT AREAS)
- **Áreas Táctiles:** Mínimo **48x48px** para todos los elementos interactivos (botones, checkboxes, enlaces estrechos).
- **Separación de Objetos:** Mínima de 8px entre elementos clicables para evitar errores de selección.

## 3. Lógica de Implementación (Frontend Mobile)
- **Sincronización:** El tema se descarga del perfil del usuario (`ThemeContext.tsx`) y se persiste localmente en `SecureStore`.
- **Previsualización:** La pantalla de configuración de temas debe mostrar una "card" de ejemplo antes de aplicar el cambio.
- **Transiciones:** El cambio de tema debe ser fluido mediante una animación de desvanecimiento suave (fade transition) de 300ms.

## 4. Auditoría de Accesibilidad (Checklist SDD)
1. [ ] Confirmar contraste WCAG AA entre Texto y Fondo en los 3 temas.
2. [ ] Validar que no existan colores hardcoded fuera del `ThemeContext`.
3. [ ] Probar áreas de toque de 48px en los elementos críticos (Solicitar Viaje, Menú).
4. [ ] Asegurar que el lector de pantalla (TalkBack/VoiceOver) identifique correctamente los iconos del tema.
