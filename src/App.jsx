import React, { useEffect, useMemo, useRef, useState } from 'react';
import WelcomeScreen from './screens/WelcomeScreen';
import CaptureScreen from './screens/CaptureScreen';
import ResultHighConfScreen from './screens/ResultHighConfScreen';
import DisambiguationScreen from './screens/DisambiguationScreen';
import SessionScreen from './screens/SessionScreen';
import AnalyzingOverlay from './components/AnalyzingOverlay';
import MockModeFooter from './components/MockModeFooter';
import {
  checkHealth,
  estimateNutrition,
  isMockEnabledByEnv,
  predictFood,
} from './services/fitqualApi';
import { createMockPreviewDataUrl } from './mocks/mockResponses';
import {
  fileToCompressedDataUrl,
  formatFoodName,
  formatKcal,
  sumSessionTotals,
} from './utils/formatters';

const STORAGE_KEY = 'fitqual_session_meal_v1';
const SAVED_MEALS_KEY = 'fitqual_saved_meals_v1';
const MEAL_NAME_KEY = 'fitqual_session_name_v1';

const SCREENS = {
  WELCOME: 'welcome',
  CAPTURE: 'capture',
  RESULT: 'result',
  DISAMBIGUATION: 'disambiguation',
  SESSION: 'session',
};

function getDefaultMealName() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'Desayuno';
  if (hour >= 11 && hour < 16) return 'Almuerzo';
  if (hour >= 16 && hour < 19) return 'Snack';
  return 'Cena';
}

function loadJsonStorage(key, fallback) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export default function App() {
  const [screen, setScreen] = useState(SCREENS.WELCOME);
  const [sessionItems, setSessionItems] = useState(() => {
    const loaded = loadJsonStorage(STORAGE_KEY, []);
    return Array.isArray(loaded) ? loaded : [];
  });
  const [savedMeals, setSavedMeals] = useState(() => {
    const loaded = loadJsonStorage(SAVED_MEALS_KEY, []);
    return Array.isArray(loaded) ? loaded : [];
  });
  const [mealName, setMealName] = useState(() => {
    try {
      return sessionStorage.getItem(MEAL_NAME_KEY) || getDefaultMealName();
    } catch {
      return getDefaultMealName();
    }
  });
  const [savedToast, setSavedToast] = useState(null);

  // Mock / API mode state (disabled and hidden in final builds when VITE_USE_MOCK=false)
  const mockAllowedByEnv = isMockEnabledByEnv();
  const [useMock, setUseMock] = useState(mockAllowedByEnv);
  const [mockScenario, setMockScenario] = useState('high');
  const [apiStatus, setApiStatus] = useState('idle');

  // Active prediction / estimation flow state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturePreview, setCapturePreview] = useState(null);
  const [predictionResult, setPredictionResult] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [initialEstimate, setInitialEstimate] = useState(null);
  const [loadingDisambiguationClass, setLoadingDisambiguationClass] = useState(null);
  const [flowError, setFlowError] = useState(null);

  const analyzeAbortRef = useRef(null);
  const toastTimerRef = useRef(null);

  // Persist active meal items, meal name, and saved meals in sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sessionItems));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }, [sessionItems]);

  useEffect(() => {
    try {
      sessionStorage.setItem(SAVED_MEALS_KEY, JSON.stringify(savedMeals));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }, [savedMeals]);

  useEffect(() => {
    try {
      sessionStorage.setItem(MEAL_NAME_KEY, mealName);
    } catch {
      // Ignore storage errors
    }
  }, [mealName]);

  // Verify backend /health when live backend mode is enabled
  useEffect(() => {
    if (useMock) {
      setApiStatus('idle');
      return undefined;
    }

    const controller = new AbortController();
    checkHealth({ useMock: false, signal: controller.signal })
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'));

    return () => controller.abort();
  }, [useMock]);

  const sessionTotals = useMemo(
    () => sumSessionTotals(sessionItems),
    [sessionItems]
  );

  const showSavedToast = (message) => {
    clearTimeout(toastTimerRef.current);
    setSavedToast(message);
    toastTimerRef.current = setTimeout(() => setSavedToast(null), 3500);
  };

  const runPredictionFlow = async ({ file = null, previewDataUrl = null }) => {
    if (analyzeAbortRef.current) {
      analyzeAbortRef.current.abort();
    }

    const controller = new AbortController();
    analyzeAbortRef.current = controller;

    setFlowError(null);
    setLoadingDisambiguationClass(null);

    try {
      const preview =
        previewDataUrl || (file ? await fileToCompressedDataUrl(file) : null);
      setCapturePreview(preview);
      setIsAnalyzing(true);

      const prediction = await predictFood(file, {
        useMock,
        mockScenario,
        signal: controller.signal,
      });

      const topCandidate = prediction?.top3?.[0];
      if (!topCandidate) {
        throw new Error('La respuesta del modelo no incluyó predicciones.');
      }

      setPredictionResult(prediction);

      const threshold = Number(prediction.threshold ?? 0.7);
      const isConfident =
        typeof prediction.confident === 'boolean'
          ? prediction.confident
          : Number(topCandidate.confidence) >= threshold;

      if (isConfident) {
        const estimate = await estimateNutrition(topCandidate.class_name, null, {
          useMock,
          signal: controller.signal,
        });
        setSelectedCandidate(topCandidate);
        setInitialEstimate(estimate);
        setScreen(SCREENS.RESULT);
      } else {
        setSelectedCandidate(null);
        setInitialEstimate(null);
        setScreen(SCREENS.DISAMBIGUATION);
      }
    } catch (error) {
      if (error?.code !== 'ABORTED') {
        setFlowError(
          error?.message || 'Ocurrió un error inesperado al analizar la foto.'
        );
        setScreen(SCREENS.CAPTURE);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCancelAnalyze = () => {
    if (analyzeAbortRef.current) {
      analyzeAbortRef.current.abort();
    }
    setIsAnalyzing(false);
  };

  const handleSelectDisambiguationOption = async (option) => {
    setFlowError(null);
    setLoadingDisambiguationClass(option.class_name);

    try {
      const estimate = await estimateNutrition(option.class_name, null, {
        useMock,
      });
      setSelectedCandidate(option);
      setInitialEstimate(estimate);
      setScreen(SCREENS.RESULT);
    } catch (error) {
      setFlowError(
        error?.message ||
          `No se pudo obtener la información nutricional de ${formatFoodName(
            option.class_name
          )}.`
      );
    } finally {
      setLoadingDisambiguationClass(null);
    }
  };

  const handleAddToMeal = (newItem) => {
    const itemWithId = {
      ...newItem,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };
    setSessionItems((prev) => [...prev, itemWithId]);
    setScreen(SCREENS.SESSION);
  };

  const handleRemoveItem = (itemId) => {
    setSessionItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleSaveMealSession = (rawName) => {
    if (sessionItems.length === 0) return;
    const cleanName = String(rawName || '').trim() || getDefaultMealName();

    const newSavedMeal = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: cleanName,
      savedAt: new Date().toISOString(),
      items: sessionItems,
      totals: sessionTotals,
    };

    setSavedMeals((prev) => [newSavedMeal, ...prev]);
    setSessionItems([]);
    setMealName(getDefaultMealName());
    setCapturePreview(null);
    setPredictionResult(null);
    setSelectedCandidate(null);
    setInitialEstimate(null);
    setFlowError(null);
    setScreen(SCREENS.CAPTURE);
    showSavedToast(`${cleanName} guardado (${formatKcal(sessionTotals.kcal)} kcal)`);
  };

  const handleDeleteSavedMeal = (mealId) => {
    setSavedMeals((prev) => prev.filter((m) => m.id !== mealId));
  };

  const handleResetSession = () => {
    setSessionItems([]);
    setMealName(getDefaultMealName());
    setCapturePreview(null);
    setPredictionResult(null);
    setSelectedCandidate(null);
    setInitialEstimate(null);
    setFlowError(null);
    setScreen(SCREENS.CAPTURE);
  };

  const handleToggleMock = (nextMock) => {
    setUseMock(nextMock);
    setFlowError(null);
  };

  return (
    <div className="flex h-dvh w-full items-stretch justify-center overflow-hidden">
      {/* Centered mobile shell on desktop (max-width: 430px, 100dvh); 100% on real phones */}
      <div className="relative mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-white sm:shadow-[0_20px_60px_-20px_rgba(19,32,26,0.22)]">
        {isAnalyzing && (
          <AnalyzingOverlay
            imagePreview={capturePreview}
            onCancel={handleCancelAnalyze}
          />
        )}

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain">
          {screen === SCREENS.WELCOME && (
            <WelcomeScreen
              sessionCount={sessionItems.length}
              onStart={() => setScreen(SCREENS.CAPTURE)}
              onContinueSession={() => setScreen(SCREENS.SESSION)}
            />
          )}

          {screen === SCREENS.CAPTURE && (
            <CaptureScreen
              sessionItems={sessionItems}
              sessionTotals={sessionTotals}
              savedMeals={savedMeals}
              savedToast={savedToast}
              errorMessage={flowError}
              onClearError={() => setFlowError(null)}
              onSelectFile={(file) => runPredictionFlow({ file })}
              onOpenSession={() => setScreen(SCREENS.SESSION)}
              onDeleteSavedMeal={handleDeleteSavedMeal}
              onOpenGuide={() => setScreen(SCREENS.WELCOME)}
            />
          )}

          {screen === SCREENS.RESULT && selectedCandidate && initialEstimate && (
            <ResultHighConfScreen
              selectedClassName={selectedCandidate.class_name}
              confidence={selectedCandidate.confidence}
              initialEstimate={initialEstimate}
              imagePreview={capturePreview}
              useMock={useMock}
              onAddToMeal={handleAddToMeal}
              onCancel={() => {
                setFlowError(null);
                setScreen(SCREENS.CAPTURE);
              }}
            />
          )}

          {screen === SCREENS.DISAMBIGUATION && predictionResult && (
            <DisambiguationScreen
              top3={predictionResult.top3 || []}
              threshold={predictionResult.threshold ?? 0.7}
              imagePreview={capturePreview}
              loadingClassName={loadingDisambiguationClass}
              errorMessage={flowError}
              onSelectOption={handleSelectDisambiguationOption}
              onBack={() => {
                setFlowError(null);
                setScreen(SCREENS.CAPTURE);
              }}
            />
          )}

          {screen === SCREENS.SESSION && (
            <SessionScreen
              items={sessionItems}
              totals={sessionTotals}
              mealName={mealName}
              onChangeMealName={setMealName}
              onRemoveItem={handleRemoveItem}
              onAddAnother={() => {
                setFlowError(null);
                setScreen(SCREENS.CAPTURE);
              }}
              onSaveSession={handleSaveMealSession}
              onResetSession={handleResetSession}
            />
          )}
        </div>

        {mockAllowedByEnv && screen !== SCREENS.WELCOME && (
          <MockModeFooter
            useMock={useMock}
            onToggleMock={handleToggleMock}
            mockScenario={mockScenario}
            onChangeScenario={setMockScenario}
            canRunMockSample={screen === SCREENS.CAPTURE}
            onRunMockSample={() =>
              runPredictionFlow({
                previewDataUrl: createMockPreviewDataUrl(mockScenario),
              })
            }
            apiStatus={apiStatus}
          />
        )}
      </div>
    </div>
  );
}
