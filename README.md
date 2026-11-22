# FitQual AI — Frontend Web Móvil (React + Vite)

Asistente nutricional mobile-first impulsado por visión artificial (MobileNetV3 entrenado sobre **Food-101**, 101 clases de alimentos) y porciones de referencia **USDA**.

Diseñado a partir del prototipo de Figma Make (`FitQual AI Mobile App`) siguiendo un flujo funcional de **3 pantallas** para **captura secuencial** sin base de datos (estado en React + persistencia en `sessionStorage`).

---

## Flujo funcional (Bienvenida + 3 pantallas)

0. **Pantalla Inicial — Bienvenida (`WelcomeScreen`):**
   - Presenta la identidad de **FitQual AI**, explica en 3 pasos cómo funciona la captura secuencial por alimento, qué pasa cuando la confianza es menor al 70% y ofrece el CTA **"Comenzar a escanear"** (accesible también luego desde el ícono `?`).

1. **Pantalla 1 — Captura y acumulado inicial (`CaptureScreen`):**
   - Botón principal **"Tomar o subir foto"** (`<input type="file" accept="image/*" capture="environment" />`) que abre la cámara en celular o el selector de archivos.
   - Overlay `"Analizando alimento..."` mientras se procesa la imagen en `POST /api/predict`.
   - Tarjeta inferior con el acumulado de la sesión actual (arranca en `0 kcal` y `0g` de proteínas, carbohidratos y grasas).

2. **Pantalla 2a — Confianza alta ($P_{\max} \ge 0.70$) (`ResultHighConfScreen`):**
   - Foto capturada, nombre formateado del alimento y porcentaje de confianza.
   - Control de porción en gramos iniciado en `standard_grams` (`-10g` / `+10g`, input numérico y slider).
   - Recálculo dinámico de `kcal`, `Proteínas`, `Carbohidratos` y `Grasas`.
   - Botón **"Agregar a mi comida"** (navega a Pantalla 3).

3. **Pantalla 2b — Baja confianza ($P_{\max} < 0.70$) (`DisambiguationScreen`):**
   - Mensaje **"No estoy seguro"** con 3 botones interactivos para el Top-3 y su porcentaje; al tocar cualquiera consulta la porción estándar y pasa a la Pantalla 2a.
   - Cuarto botón **"Ninguna de estas"** (escape para alimentos fuera de las 101 clases de Food-101, como una arepa) con botón **"Volver a intentar"**.

4. **Pantalla 3 — Sesión de comida (`SessionScreen`):**
   - Lista de alimentos agregados con gramos, kcal, macros y botón para eliminar cada ítem.
   - Totales consolidados en tiempo real.
   - **"+ Agregar otro alimento"** (captura secuencial conservando el acumulado) y **"Nueva comida"** (reinicia la sesión a `0 kcal`).

---

## Estructura del proyecto

```text
src/
├── components/        # Header, MacroCard, PortionControl, FoodItemRow, AnalyzingOverlay, MockModeFooter
├── screens/           # CaptureScreen, ResultHighConfScreen, DisambiguationScreen, SessionScreen
├── services/
│   ├── httpClient.js  # Cliente HTTP base sobre fetch usando VITE_API_URL
│   └── fitqualApi.js  # checkHealth(), predictFood(imageFile), estimateNutrition(className, grams)
├── mocks/
│   └── mockResponses.js # Respuestas simuladas (Confianza Alta >= 0.70 y Confianza Baja < 0.70)
└── utils/
    └── formatters.js  # Formateo Food-101, redondeo de macros, escalado y compresión de miniaturas
```

---

## Ejecución en local

### 1. Instalar dependencias y configurar entorno
```bash
npm install
cp .env.example .env.local
```

Variables en `.env.local` para conectar con el backend en Docker local:
```env
VITE_API_URL=http://127.0.0.1:8001
VITE_USE_MOCK=false
```

### 2. Conectar Backend + Frontend en local (Docker + Vite)
Requisitos: **Docker Desktop**, **Node.js** y **Git**.

1. **En una terminal — Backend ([`ptia-fitqual-ai-back`](https://github.com/DANFELcode/ptia-fitqual-ai-back)):**
   ```bash
   git clone https://github.com/DANFELcode/ptia-fitqual-ai-back.git
   cd ptia-fitqual-ai-back
   docker build -t fitqual-back .
   docker run --rm -p 8001:8000 fitqual-back
   ```
2. **En otra terminal — Frontend (`ptia-fitqual-ai-front`):**
   ```bash
   git clone https://github.com/JUDAMUCH03/ptia-fitqual-ai-front.git
   cd ptia-fitqual-ai-front
   printf "VITE_API_URL=http://127.0.0.1:8001\nVITE_USE_MOCK=false\n" > .env.local
   npm install
   npm run dev
   ```
3. Abre `http://localhost:5173/`.

*(Nota: Con `VITE_USE_MOCK=false` —el valor por defecto en producción—, el modo mock queda completamente desactivado y oculto en la interfaz. Solo si deseas probar la UI aislada sin backend, configura `VITE_USE_MOCK=true` en `.env.local`).*

---

## Contratos esperados del Backend (FastAPI)

- `GET /health` → `{ "status": "ok" }`
- `POST /api/predict` (`multipart/form-data`, campo `file`) →
  ```json
  {
    "top3": [
      { "class_name": "pizza", "confidence": 0.49 },
      { "class_name": "lasagna", "confidence": 0.25 },
      { "class_name": "hamburger", "confidence": 0.12 }
    ],
    "confident": false,
    "threshold": 0.70
  }
  ```
- `POST /api/estimate` (`{ "class_name": "pizza", "grams": 150 }` o `grams: null`) →
  ```json
  {
    "class_name": "pizza",
    "grams": 150,
    "standard_grams": 150,
    "kcal": 399,
    "protein_g": 17.1,
    "carbs_g": 49.5,
    "fat_g": 14.7
  }
  ```

---

## Despliegue (Vercel + Azure) y Docker opcional

### Frontend en Vercel (recomendado)
1. Importa este repositorio en Vercel (detectará Vite automáticamente gracias a [vercel.json](vercel.json)).
2. Configura las variables de entorno en Vercel:
   - `VITE_API_URL`: URL pública del backend en Azure (ej. `https://fitqual-api.azurewebsites.net`)
   - `VITE_USE_MOCK`: `false`
3. Despliega (`npm run build` genera `dist/`).

### Contenedor Docker (opcional)
```bash
docker build --build-arg VITE_API_URL=http://localhost:8000 --build-arg VITE_USE_MOCK=false -t fitqual-front .
docker run -p 8080:80 fitqual-front
```
