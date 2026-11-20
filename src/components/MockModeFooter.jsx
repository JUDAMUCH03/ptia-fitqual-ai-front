import React from 'react';
import { FlaskConical, Play, Server } from 'lucide-react';
import { MOCK_SCENARIOS } from '../mocks/mockResponses';

/**
 * Discreet developer/demo switch in the footer allowing seamless switching
 * between Mock Mode (with High/Low confidence scenarios) and the live FastAPI backend.
 */
export default function MockModeFooter({
  useMock,
  onToggleMock,
  mockScenario,
  onChangeScenario,
  canRunMockSample = false,
  onRunMockSample,
  apiStatus = 'idle', // 'idle' | 'online' | 'offline'
}) {
  return (
    <footer
      className="mt-auto border-t border-black/[0.06] bg-white px-4 pt-2.5"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full ${
              useMock ? 'bg-mint/12 text-forest' : 'bg-canvas text-muted'
            }`}
          >
            {useMock ? (
              <FlaskConical className="h-3.5 w-3.5" />
            ) : (
              <Server className="h-3.5 w-3.5" />
            )}
          </span>
          <div>
            <p className="text-[11px] font-bold leading-none text-ink">
              {useMock ? 'Modo Mock' : 'Backend FastAPI'}
            </p>
            <p className="mt-0.5 text-[10px] font-medium text-muted">
              {useMock
                ? 'Respuestas simuladas'
                : apiStatus === 'online'
                ? 'Conectado (/health OK)'
                : apiStatus === 'offline'
                ? 'Servidor sin respuesta'
                : 'Conectando...'}
            </p>
          </div>
        </div>

        {/* Toggle Switch matching Figma Settings */}
        <button
          type="button"
          role="switch"
          aria-checked={useMock}
          aria-label="Alternar Modo Mock"
          onClick={() => onToggleMock(!useMock)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
            useMock ? 'bg-mint' : 'bg-black/15'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              useMock ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {useMock && (
        <div className="mt-2 flex items-center gap-1.5">
          <div className="flex flex-1 items-center gap-1 rounded-xl bg-canvas p-1">
            {Object.values(MOCK_SCENARIOS).map((scenario) => {
              const active = mockScenario === scenario.id;
              return (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => onChangeScenario(scenario.id)}
                  className={`flex-1 rounded-lg px-2 py-1 text-[10px] font-bold transition ${
                    active
                      ? 'bg-white text-forest shadow-xs'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  {scenario.shortLabel}
                </button>
              );
            })}
          </div>

          {canRunMockSample && onRunMockSample && (
            <button
              type="button"
              onClick={onRunMockSample}
              title="Probar flujo mock sin seleccionar foto"
              className="inline-flex h-7 shrink-0 items-center gap-1 rounded-xl bg-forest px-2.5 text-[10px] font-bold text-white transition active:scale-95"
            >
              <Play className="h-3 w-3 fill-current" />
              <span>Probar</span>
            </button>
          )}
        </div>
      )}
    </footer>
  );
}
