# Hambre Cero — Simulador de distribución alimentaria

Aplicación educativa para comparar un recorrido secuencial hipotético con una regla corregida que prioriza hogares graves, luego exclusivamente moderados, ordena por prevalencia descendente y desempata por ID ascendente.

## Ejecutar localmente

Requiere Node.js 20.19 o posterior (o Node.js 22.12 o posterior).

```bash
npm install
npm run dev
```

Para generar y revisar la versión de producción:

```bash
npm run build
npm run preview
```

## Despliegue en GitHub y Netlify

1. Crea un repositorio nuevo en GitHub llamado `hambre-cero`.
2. Sube el contenido de esta carpeta a la rama `main` del repositorio.
3. En Netlify elige **Add new site → Import an existing project** y conecta GitHub.
4. Selecciona `hambre-cero`. Netlify detecta `netlify.toml`; los valores son comando `npm run build` y carpeta publicada `dist`.
5. Inicia el despliegue. Netlify entregará la URL pública al completar la compilación.

La configuración está guardada en `netlify.toml`. No necesita variables de entorno, backend ni base de datos. La aplicación aún no está publicada: el enlace público aparecerá después de conectar el repositorio y completar el despliegue en una cuenta Netlify.

## Datos y alcance

Se incluyen los **32 departamentos y Bogotá D. C.** con prevalencia moderada o grave y grave para 2025. Los cinco valores entregados originalmente para el ejercicio se conservan: Risaralda 10,3 % / 1,5 %; Caldas 9,2 % / 1,3 %; Córdoba 40,2 % / 5,9 %; La Guajira 47,8 % / 16,4 %; Chocó 56,8 % / 17,9 %. La fuente verificada es el [boletín técnico DANE, Inseguridad alimentaria — ECV 2025 (publicado el 21 de mayo de 2026)](https://www.dane.gov.co/files/operaciones/FIES/bol-FIES-2025.pdf), en especial los gráficos departamentales de prevalencia moderada o grave y grave.

Los 1.000 hogares simulados por ubicación (33.000 en total) y los 500 mercados iniciales son parámetros didácticos, no conteos de DANE ni de inventario público real. Las categorías moderadas exclusivas se estiman restando la prevalencia grave a la prevalencia moderada o grave; los conteos se redondean al entero más cercano. El algoritmo secuencial es un caso hipotético para mostrar cómo el orden fijo puede afectar la distribución; no se atribuye a DANE ni a un sistema público real. La aplicación no asigna ayudas reales.

## Funciones

- Parámetros editables por departamento: porcentajes y cantidad de hogares.
- Inventario de mercados editable, con validaciones y restablecimiento a valores iniciales.
- Comparación de hogares atendidos y cobertura grave, con barras por departamento.
- Trazas de decisión con ID, categoría, inventario antes y después.
- Vista de reglas, supuestos y límites del modelo.

## Stack

React, TypeScript, Vite y Lucide. Los gráficos se dibujan con elementos HTML/CSS; no requieren servicio externo.
