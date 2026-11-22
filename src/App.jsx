import React, { useEffect, useMemo, useRef, useState } from 'react';
import WelcomeScreen from './screens/WelcomeScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import DashboardScreen from './screens/DashboardScreen';
import DiaryScreen from './screens/DiaryScreen';
import ProgressScreen from './screens/ProgressScreen';
import ProfileScreen from './screens/ProfileScreen';
import CaptureScreen from './screens/CaptureScreen';
import ResultHighConfScreen from './screens/ResultHighConfScreen';
import DisambiguationScreen from './screens/DisambiguationScreen';
import SessionScreen from './screens/SessionScreen';
import AnalyzingOverlay from './components/AnalyzingOverlay';
import MockModeFooter from './components/MockModeFooter';
import BottomNav from './components/BottomNav';
import Celebration from './components/Celebration';
import { Toast } from './components/ui';
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
import {
  WATER_GOAL_GLASSES,
  buildDiaryCsv,
  calcAchievements,
  dayStatus,
  calcStreak,
  calcTargets,
  mealsForDay,
  sumMeals,
  todayKey,
} from './utils/fitness';

const STORAGE_KEY = 'fitqual_session_meal_v1';
const SAVED_MEALS_KEY = 'fitqual_saved_meals_v1';
const MEAL_NAME_KEY = 'fitqual_session_name_v1';
const PROFILE_KEY = 'fitqual_profile_v1';
const WEIGHTS_KEY = 'fitqual_weights_v1';
const WATER_KEY = 'fitqual_water_v1';
const MOCK_KEY = 'fitqual_use_mock_v1';
const CELEBRATED_KEY = 'fitqual_celebrated_v1';
const ALL_KEYS = [STORAGE_KEY, SAVED_MEALS_KEY, MEAL_NAME_KEY, PROFILE_KEY, WEIGHTS_KEY, WATER_KEY, CELEBRATED_KEY];

const SCREENS = {
  WELCOME: 'welcome',
  ONBOARDING: 'onboarding',
  EDIT_PROFILE: 'edit_profile',
  HOME: 'home',
  DIARY: 'diary',
  PROGRESS: 'progress',
  PROFILE: 'profile',
  CAPTURE: 'capture',
  RESULT: 'result',
  DISAMBIGUATION: 'disambiguation',
  SESSION: 'session',
};

// Pantallas con barra de navegación inferior
const TAB_SCREENS = new Set([
  SCREENS.HOME,
  SCREENS.DIARY,
  SCREENS.PROGRESS,
  SCREENS.PROFILE,
  SCREENS.CAPTURE,
  SCREENS.SESSION,
]);

function getDefaultMealName() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'Desayuno';
  if (hour >= 11 && hour < 16) return 'Almuerzo';
  if (hour >= 16 && hour < 19) return 'Snack';
  return 'Cena';
}

function loadJsonStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function usePersistentState(key, initial) {
  const [value, setValue] = useState(() => loadJsonStorage(key, initial));
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignorar errores de cuota de almacenamiento
    }
  }, [key, value]);
  return [value, setValue];
}

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export default function App() {
  const [profile, setProfile] = usePersistentState(PROFILE_KEY, null);
  const [savedMeals, setSavedMeals] = usePersistentState(SAVED_MEALS_KEY, []);
  const [sessionItems, setSessionItems] = usePersistentState(STORAGE_KEY, []);
  const [weights, setWeights] = usePersistentState(WEIGHTS_KEY, []);
  const [water, setWater] = usePersistentState(WATER_KEY, {});
  const [mealName, setMealName] = useState(() => {
    const stored = loadJsonStorage(MEAL_NAME_KEY, null);
    return typeof stored === 'string' ? stored : getDefaultMealName();
  });
  const [screen, setScreen] = useState(() =>
    loadJsonStorage(PROFILE_KEY, null) ? SCREENS.HOME : SCREENS.WELCOME
  );
  const [toast, setToast] = useState(null);
  const [celebration, setCelebration] = useState(null);
  const [celebratedDay, setCelebratedDay] = usePersistentState(CELEBRATED_KEY, null);

  // Modo demo: deshabilitado y oculto en la versión final (VITE_USE_MOCK=false)
  const mockAllowedByEnv = isMockEnabledByEnv();
  const [useMock, setUseMock] = useState(() => {
    if (!mockAllowedByEnv) return false;
    const stored = loadJsonStorage(MOCK_KEY, null);
    return typeof stored === 'boolean' ? stored : true;
  });
  const [mockScenario, setMockScenario] = useState('high');
  const [apiStatus, setApiStatus] = useState('idle');

  // Flujo de reconocimiento activo
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturePreview, setCapturePreview] = useState(null);
  const [predictionResult, setPredictionResult] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [initialEstimate, setInitialEstimate] = useState(null);
  const [loadingDisambiguationClass, setLoadingDisambiguationClass] = useState(null);
  const [flowError, setFlowError] = useState(null);

  const analyzeAbortRef = useRef(null);
  const toastTimerRef = useRef(null);
  // Tiempo de registro por alimento (se guarda en cada ítem y sale en la exportación CSV)
  const captureStartRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(MEAL_NAME_KEY, JSON.stringify(mealName));
      localStorage.setItem(MOCK_KEY, JSON.stringify(useMock));
    } catch {
      // Ignorar
    }
  }, [mealName, useMock]);

  useEffect(() => {
    if (useMock) {
      setApiStatus('idle');
      return undefined;
    }
    const controller = new AbortController();
    setApiStatus('idle');
    checkHealth({ useMock: false, signal: controller.signal })
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'));
    return () => controller.abort();
  }, [useMock]);

  // Volver arriba al cambiar de pantalla
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [screen]);

  const targets = useMemo(() => calcTargets(profile), [profile]);
  const sessionTotals = useMemo(() => sumSessionTotals(sessionItems), [sessionItems]);
  const today = todayKey();
  const todayMeals = useMemo(() => mealsForDay(savedMeals, today), [savedMeals, today]);
  const todayTotals = useMemo(() => sumMeals(todayMeals), [todayMeals]);
  const streak = useMemo(() => calcStreak(savedMeals), [savedMeals]);
  const achievements = useMemo(
    () => calcAchievements({ meals: savedMeals, water, weights, targets, profile }),
    [savedMeals, water, weights, targets, profile]
  );
  const unlockedRef = useRef(null);

  const showToast = (message) => {
    clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  };

  // Celebración al cumplir la meta del día (una vez por día, con las comidas ya guardadas)
  useEffect(() => {
    if (!profile) return;
    if (dayStatus(todayTotals.kcal, targets.kcal) === 'met' && celebratedDay !== today) {
      setCelebratedDay(today);
      setCelebration({
        title: '¡Meta del día cumplida!',
        message: `Llegaste a ${formatKcal(todayTotals.kcal)} de ${targets.kcal} kcal.${
          streak > 1 ? ` Llevas ${streak} días seguidos registrando.` : ''
        } Así se construye el hábito.`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayTotals.kcal, targets.kcal, profile]);

  // Aviso cuando se desbloquea un logro nuevo (no al abrir la app)
  useEffect(() => {
    const ids = new Set(achievements.filter((a) => a.unlocked).map((a) => a.id));
    if (unlockedRef.current) {
      const fresh = achievements.find((a) => a.unlocked && !unlockedRef.current.has(a.id));
      if (fresh) showToast(`🏆 Logro desbloqueado: ${fresh.title}`);
    }
    unlockedRef.current = ids;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [achievements]);

  const handleChangeWater = (delta) => {
    const next = Math.max(0, (Number(water[today]) || 0) + delta);
    setWater((prev) => ({ ...prev, [today]: next }));
    if (delta > 0 && next === WATER_GOAL_GLASSES) {
      showToast('💧 ¡Meta de agua cumplida! 2 litros hoy');
    }
  };

  const markCaptureStart = () => {
    if (captureStartRef.current === null) {
      captureStartRef.current = performance.now();
    }
  };

  /* ------------------------------ Perfil ------------------------------ */

  const upsertTodayWeight = (kg) => {
    setWeights((prev) => [...prev.filter((w) => w.date !== today), { date: today, kg }]);
  };

  const handleCompleteProfile = (data) => {
    const isNew = !profile;
    setProfile(data);
    if (isNew || Number(profile?.weightKg) !== Number(data.weightKg)) {
      upsertTodayWeight(data.weightKg);
    }
    setScreen(isNew ? SCREENS.HOME : SCREENS.PROFILE);
    showToast(isNew ? `¡Listo, ${data.name.split(' ')[0]}! Tu meta es ${calcTargets(data).kcal} kcal` : 'Perfil actualizado');
  };

  const handleLogWeight = (kg) => {
    upsertTodayWeight(kg);
    setProfile((prev) => (prev ? { ...prev, weightKg: kg } : prev));
    showToast(`Peso registrado: ${kg} kg`);
  };

  const handleExport = () => {
    const csv = buildDiaryCsv(savedMeals);
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitqual_diario_${today}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleResetAll = () => {
    ALL_KEYS.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {
        // Ignorar
      }
    });
    setProfile(null);
    setSavedMeals([]);
    setSessionItems([]);
    setWeights([]);
    setWater({});
    setMealName(getDefaultMealName());
    setScreen(SCREENS.WELCOME);
  };

  /* ------------------------- Flujo de reconocimiento ------------------------- */

  const runPredictionFlow = async ({ file = null, previewDataUrl = null }) => {
    if (analyzeAbortRef.current) {
      analyzeAbortRef.current.abort();
    }
    const controller = new AbortController();
    analyzeAbortRef.current = controller;

    setFlowError(null);
    setLoadingDisambiguationClass(null);
    markCaptureStart();

    try {
      const preview = previewDataUrl || (file ? await fileToCompressedDataUrl(file) : null);
      setCapturePreview(preview);
      setIsAnalyzing(true);

      const prediction = await predictFood(file, {
        useMock,
        mockScenario,
        signal: controller.signal,
      });

      const topCandidate = prediction?.top3?.[0];
      if (!topCandidate) {
        throw new Error('No pudimos reconocer la foto. Intenta de nuevo.');
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
        setSelectedCandidate({ ...topCandidate, source: 'auto' });
        setInitialEstimate(estimate);
        setScreen(SCREENS.RESULT);
      } else {
        setSelectedCandidate(null);
        setInitialEstimate(null);
        setScreen(SCREENS.DISAMBIGUATION);
      }
    } catch (error) {
      if (error?.code !== 'ABORTED') {
        setFlowError(error?.message || 'Ocurrió un error inesperado al analizar la foto.');
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
      const estimate = await estimateNutrition(option.class_name, null, { useMock });
      setSelectedCandidate(option);
      setInitialEstimate(estimate);
      setScreen(SCREENS.RESULT);
    } catch (error) {
      setFlowError(
        error?.message ||
          `No se pudo obtener la información nutricional de ${formatFoodName(option.class_name)}.`
      );
    } finally {
      setLoadingDisambiguationClass(null);
    }
  };

  /* --------------------------- Comida en curso --------------------------- */

  const handleAddToMeal = (newItem) => {
    const elapsedMs =
      captureStartRef.current !== null ? Math.round(performance.now() - captureStartRef.current) : null;
    captureStartRef.current = null;
    setSessionItems((prev) => [...prev, { ...newItem, elapsedMs, id: newId() }]);
    setScreen(SCREENS.SESSION);
  };

  const handleRemoveItem = (itemId) => {
    setSessionItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const clearFlow = () => {
    setCapturePreview(null);
    setPredictionResult(null);
    setSelectedCandidate(null);
    setInitialEstimate(null);
    setFlowError(null);
    captureStartRef.current = null;
  };

  const handleSaveMealSession = () => {
    if (sessionItems.length === 0) return;
    const name = mealName || getDefaultMealName();
    const meal = {
      id: newId(),
      name,
      date: today,
      savedAt: new Date().toISOString(),
      items: sessionItems,
      totals: sessionTotals,
    };
    setSavedMeals((prev) => [meal, ...prev]);
    setSessionItems([]);
    setMealName(getDefaultMealName());
    clearFlow();
    setScreen(SCREENS.HOME);
    showToast(`${name} guardado · ${formatKcal(sessionTotals.kcal)} kcal`);
  };

  const handleResetSession = () => {
    setSessionItems([]);
    setMealName(getDefaultMealName());
    clearFlow();
    setScreen(SCREENS.CAPTURE);
  };

  /* ------------------------------- Diario ------------------------------- */

  const handleRemoveDiaryItem = (mealId, itemId) => {
    setSavedMeals((prev) =>
      prev
        .map((meal) => {
          if (meal.id !== mealId) return meal;
          const items = (meal.items || []).filter((it) => it.id !== itemId);
          return { ...meal, items, totals: sumSessionTotals(items) };
        })
        .filter((meal) => (meal.items || []).length > 0)
    );
  };

  const handleDeleteMeal = (mealId) => {
    setSavedMeals((prev) => prev.filter((m) => m.id !== mealId));
  };

  const startMeal = (type) => {
    if (sessionItems.length === 0) setMealName(type);
    setFlowError(null);
    setScreen(SCREENS.CAPTURE);
  };

  const navigate = (tab) => {
    setFlowError(null);
    if (tab === 'capture') {
      setScreen(sessionItems.length > 0 ? SCREENS.SESSION : SCREENS.CAPTURE);
      return;
    }
    setScreen(tab);
  };

  const activeTab =
    screen === SCREENS.CAPTURE || screen === SCREENS.SESSION ? 'capture' : screen;

  return (
    <div className="flex h-dvh w-full items-stretch justify-center overflow-hidden">
      <div className="relative mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-white sm:shadow-[0_20px_60px_-20px_rgba(19,32,26,0.22)]">
        {isAnalyzing && <AnalyzingOverlay imagePreview={capturePreview} onCancel={handleCancelAnalyze} />}
        <Toast message={toast} />
        {celebration && (
          <Celebration
            title={celebration.title}
            message={celebration.message}
            onClose={() => setCelebration(null)}
          />
        )}

        <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain">
          {screen === SCREENS.WELCOME && (
            <WelcomeScreen
              sessionCount={0}
              onStart={() => setScreen(profile ? SCREENS.HOME : SCREENS.ONBOARDING)}
            />
          )}

          {screen === SCREENS.ONBOARDING && (
            <OnboardingScreen onComplete={handleCompleteProfile} onCancel={() => setScreen(SCREENS.WELCOME)} />
          )}

          {screen === SCREENS.EDIT_PROFILE && profile && (
            <OnboardingScreen
              initialProfile={profile}
              onComplete={handleCompleteProfile}
              onCancel={() => setScreen(SCREENS.PROFILE)}
            />
          )}

          {screen === SCREENS.HOME && profile && (
            <DashboardScreen
              profile={profile}
              targets={targets}
              todayTotals={todayTotals}
              todayMeals={todayMeals}
              sessionItems={sessionItems}
              sessionTotals={sessionTotals}
              mealName={mealName}
              streak={streak}
              waterGlasses={Number(water[today]) || 0}
              onChangeWater={handleChangeWater}
              onAddMeal={startMeal}
              onContinueSession={() => setScreen(SCREENS.SESSION)}
              onOpenDiary={() => setScreen(SCREENS.DIARY)}
            />
          )}

          {screen === SCREENS.DIARY && (
            <DiaryScreen
              savedMeals={savedMeals}
              targets={targets}
              onRemoveItem={handleRemoveDiaryItem}
              onDeleteMeal={handleDeleteMeal}
              onAddMeal={startMeal}
            />
          )}

          {screen === SCREENS.PROGRESS && (
            <ProgressScreen
              savedMeals={savedMeals}
              targets={targets}
              profile={profile}
              weights={weights}
              water={water}
              streak={streak}
              onLogWeight={handleLogWeight}
            />
          )}

          {screen === SCREENS.PROFILE && profile && (
            <ProfileScreen
              profile={profile}
              targets={targets}
              weights={weights}
              onEditProfile={() => setScreen(SCREENS.EDIT_PROFILE)}
              onSetCustomKcal={(kcal) => setProfile((prev) => ({ ...prev, customKcal: kcal }))}
              onExport={handleExport}
              onResetAll={handleResetAll}
              mockAllowed={mockAllowedByEnv}
              useMock={useMock}
              onToggleMock={setUseMock}
              apiStatus={apiStatus}
            />
          )}

          {screen === SCREENS.CAPTURE && (
            <CaptureScreen
              sessionItems={sessionItems}
              sessionTotals={sessionTotals}
              errorMessage={flowError}
              onClearError={() => setFlowError(null)}
              onSelectFile={(file) => runPredictionFlow({ file })}
              onOpenSession={() => setScreen(SCREENS.SESSION)}
              onStartCapture={markCaptureStart}
              mealName={mealName}
              onChangeMealName={setMealName}
            />
          )}

          {screen === SCREENS.RESULT && selectedCandidate && initialEstimate && (
            <ResultHighConfScreen
              selectedClassName={selectedCandidate.class_name}
              confidence={selectedCandidate.confidence}
              initialEstimate={initialEstimate}
              imagePreview={capturePreview}
              useMock={useMock}
              decisionSource={selectedCandidate.source || 'auto'}
              mealName={mealName}
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

        {/* Controles del modo demo: solo en Registrar y solo si está activo */}
        {mockAllowedByEnv && useMock && screen === SCREENS.CAPTURE && (
          <MockModeFooter
            useMock={useMock}
            onToggleMock={setUseMock}
            mockScenario={mockScenario}
            onChangeScenario={setMockScenario}
            canRunMockSample
            onRunMockSample={() =>
              runPredictionFlow({ previewDataUrl: createMockPreviewDataUrl(mockScenario) })
            }
            apiStatus={apiStatus}
          />
        )}

        {profile && TAB_SCREENS.has(screen) && <BottomNav active={activeTab} onNavigate={navigate} />}
      </div>
    </div>
  );
}
