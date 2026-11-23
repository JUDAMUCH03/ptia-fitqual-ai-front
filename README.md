# FitQual AI — Frontend Web Móvil (React + Vite)

Asistente nutricional mobile-first impulsado por visión artificial (MobileNetV3 entrenado sobre **Food-101**, 101 clases de alimentos) y porciones de referencia **USDA**.

**Entrega final (Hito 3):** [Video de presentación y demo del MVP](https://youtu.be/YQqdyIhd7so) · [Backend y notebook de entrenamiento](https://github.com/DANFELcode/ptia-fitqual-ai-back)

Aplicación de seguimiento nutricional: el usuario crea su perfil, recibe metas diarias de calorías y macronutrientes, registra cada plato con una foto y sigue su progreso. No usa cuentas ni base de datos: el estado vive en React y se guarda en `localStorage`.

---

## Funcionalidades

Navegación con barra inferior: **Hoy · Diario · Registrar (cámara) · Progreso · Perfil**.

- **Onboarding y perfil** (`OnboardingScreen`, `ProfileScreen`): nombre, sexo, edad, estatura, peso, peso meta, nivel de actividad y objetivo (perder, mantener o ganar). La meta de calorías se calcula con la **ecuación de Mifflin-St Jeor** (metabolismo basal × factor de actividad ± ajuste del objetivo). Los macros salen así: proteína por kg de peso, grasa el 25 % de las kcal y carbohidratos el resto. La meta se puede ajustar a mano.
- **Hoy** (`DashboardScreen`):
  - Anillo de calorías restantes y barras de proteína, carbos y grasa frente a la meta.
  - Comidas del día por tipo (desayuno, almuerzo, snack y cena).
  - Contador de agua y racha de días seguidos.
  - Tarjeta de estado del día: qué falta y qué comer, meta cumplida (±10 %) o meta superada.
- **Registrar**: flujo de reconocimiento por foto (ver abajo). Cada plato se suma a la comida elegida y, al guardarla, pasa al diario.
- **Diario** (`DiaryScreen`): historial día por día; se pueden quitar alimentos o comidas.
- **Progreso** (`ProgressScreen`):
  - Calorías de la semana o el mes frente a la meta, promedio diario, días dentro de la meta y proteína promedio.
  - Distribución de macros.
  - Peso con gráfica, IMC y avance hacia el peso meta.
  - Logros desbloqueables.
- **Celebración** al cumplir la meta del día y avisos al completar el agua o desbloquear un logro.
- **Exportar diario a CSV** (Perfil): una fila por alimento, con la confianza del modelo, cómo se decidió (`auto`, `top3` o `manual`) y el tiempo que tomó registrarlo.

### Flujo de reconocimiento por foto

1. **Captura (`CaptureScreen`)**: el usuario toma o sube una foto de un plato a la vez y elige la comida a la que pertenece. La imagen se envía a `POST /api/predict`.
2. **Confianza alta, $P_{\max} \ge 0.70$ (`ResultHighConfScreen`)**: se muestra el plato reconocido con la porción estándar USDA. Los gramos se ajustan con `-10g`/`+10g`, un campo numérico o el slider, y las calorías y macros se recalculan.
3. **Confianza baja, $P_{\max} < 0.70$ (`DisambiguationScreen`)**: aparecen el mensaje "No estoy seguro" y las 3 opciones más probables. Con **"Ninguna de estas"** se abre una **búsqueda manual** por nombre (en español o inglés) entre las 101 clases, junto con la opción de volver a intentar.
4. **Comida en curso (`SessionScreen`)**: lista de platos con sus totales. Desde ahí se agrega otro plato o se guarda la comida en el diario.

---

## Estructura del proyecto

```text
src/
├── components/   # BottomNav, ui (Card, Ring, barras), DayStatusCard, Celebration, Achievements,
│                 # ManualFoodSearch, MacroCard, PortionControl, FoodItemRow, CameraModal, ...
├── screens/      # Welcome, Onboarding, Dashboard, Diary, Progress, Profile,
│                 # Capture, ResultHighConf, Disambiguation, Session
├── services/
│   ├── httpClient.js  # Cliente HTTP base sobre fetch usando VITE_API_URL
│   └── fitqualApi.js  # checkHealth(), predictFood(imageFile), estimateNutrition(className, grams)
├── data/
│   └── foodClasses.js # 101 clases de Food-101 con nombre en español y búsqueda manual
├── mocks/
│   └── mockResponses.js # Respuestas simuladas (confianza alta y baja)
└── utils/
    ├── fitness.js     # Metas (Mifflin-St Jeor), fechas, rachas, progreso, logros y exportación CSV
    └── formatters.js  # Nombres de platos, redondeo de macros, escalado y compresión de miniaturas
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

*(Nota: Con `VITE_USE_MOCK=false` —el valor por defecto en producción—, el modo mock queda completamente desactivado y oculto en la interfaz. Solo si deseas probar la UI aislada sin backend, configura `VITE_USE_MOCK=true` en `.env.local`; el modo demo se activa o desactiva desde **Perfil → Opciones de demostración**).*

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
