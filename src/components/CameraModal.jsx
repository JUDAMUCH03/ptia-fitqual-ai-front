import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Camera, Image as ImageIcon, RefreshCw, X } from 'lucide-react';

/**
 * In-app live camera viewfinder using WebRTC getUserMedia (works over HTTPS on Vercel
 * and localhost) with Figma Make reticle styling and direct fallback to Gallery.
 */
export default function CameraModal({
  galleryInputId,
  onCaptureFile,
  onClose,
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [status, setStatus] = useState('starting'); // 'starting' | 'ready' | 'error'
  const [errorDetail, setErrorDetail] = useState('');
  const [facingMode, setFacingMode] = useState('environment');

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async (mode = facingMode) => {
    stopStream();
    setStatus('starting');
    setErrorDetail('');

    if (!navigator?.mediaDevices?.getUserMedia) {
      setStatus('error');
      setErrorDetail(
        'Este navegador no permite cámara web directa (requiere abrir el enlace HTTPS en Safari). Usa Fototeca para subir tu foto.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });

      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;

      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      video.muted = true;

      await video.play();
      setStatus('ready');
    } catch (err) {
      stopStream();
      setStatus('error');
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setErrorDetail(
          'Permiso de cámara denegado. Revisa Ajustes → Safari → Cámara, o elige una foto desde tu Fototeca.'
        );
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        setErrorDetail('No se detectó una cámara disponible en este dispositivo.');
      } else {
        setErrorDetail(
          'No se pudo iniciar el visor de cámara (si abriste el link dentro de WhatsApp, ábrelo directamente en Safari). También puedes usar Fototeca.'
        );
      }
    }
  };

  useEffect(() => {
    startCamera(facingMode);
    return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const handleTakePhoto = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setStatus('error');
      setErrorDetail('La cámara aún no entrega imagen. Intenta de nuevo o usa Fototeca.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `fitqual-capture-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });
        stopStream();
        onCaptureFile(file);
      },
      'image/jpeg',
      0.9
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cámara de FitQual AI"
      className="fixed inset-0 z-50 mx-auto flex h-dvh w-full max-w-[430px] flex-col justify-between overflow-hidden bg-black text-white"
    >
      {/* Live Camera Video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${
          status === 'ready' ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Subtle vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/75"
      />

      {/* Top Bar */}
      <div
        className="relative z-10 flex items-center justify-between px-4 pt-4"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      >
        <button
          type="button"
          onClick={() => {
            stopStream();
            onClose();
          }}
          aria-label="Cerrar cámara"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white transition active:scale-95"
        >
          <X className="h-5 w-5" />
        </button>

        <span className="rounded-full bg-white/95 px-3.5 py-1.5 text-[11px] font-bold text-ink shadow-md">
          Enfoca un solo alimento
        </span>

        <button
          type="button"
          onClick={() =>
            setFacingMode((prev) =>
              prev === 'environment' ? 'user' : 'environment'
            )
          }
          aria-label="Cambiar cámara"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white transition active:scale-95"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Center Reticle or Error/Loading State */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-6">
        {status === 'starting' && (
          <div className="rounded-2xl bg-black/60 px-5 py-3 text-center">
            <Camera className="mx-auto h-6 w-6 animate-pulse text-mint" />
            <p className="mt-2 text-[13px] font-semibold text-white">
              Iniciando cámara...
            </p>
          </div>
        )}

        {status === 'ready' && (
          <div className="pointer-events-none relative h-[250px] w-[250px]">
            <span className="absolute top-0 left-0 h-8 w-8 rounded-tl-2xl border-t-[3.5px] border-l-[3.5px] border-mint" />
            <span className="absolute top-0 right-0 h-8 w-8 rounded-tr-2xl border-t-[3.5px] border-r-[3.5px] border-mint" />
            <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-2xl border-b-[3.5px] border-l-[3.5px] border-mint" />
            <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-2xl border-b-[3.5px] border-r-[3.5px] border-mint" />
          </div>
        )}

        {status === 'error' && (
          <div className="w-full max-w-[330px] rounded-[26px] bg-white p-5 text-center text-ink shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-700">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h2 className="mt-3 text-[17px] font-extrabold text-ink">
              Cámara no disponible
            </h2>
            <p className="mt-1.5 text-[12px] font-medium leading-relaxed text-muted">
              {errorDetail}
            </p>

            <div className="mt-4 flex flex-col gap-2">
              <label
                htmlFor={galleryInputId}
                onClick={() => {
                  stopStream();
                  onClose();
                }}
                className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-forest px-4 text-[13px] font-bold text-white transition active:scale-95"
              >
                <ImageIcon className="h-4 w-4" />
                <span>Elegir de Fototeca / Archivo</span>
              </label>

              <button
                type="button"
                onClick={() => startCamera(facingMode)}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-canvas px-4 text-[13px] font-bold text-ink transition active:scale-95"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Reintentar cámara</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Camera Controls */}
      <div
        className="relative z-10 flex items-center justify-between bg-black/55 px-7 pt-4"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        <label
          htmlFor={galleryInputId}
          onClick={() => {
            stopStream();
            onClose();
          }}
          className="flex cursor-pointer flex-col items-center gap-1 text-[11px] font-semibold text-white/90 active:scale-95"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15">
            <ImageIcon className="h-5 w-5" />
          </span>
          <span>Fototeca</span>
        </label>

        <button
          type="button"
          disabled={status !== 'ready'}
          onClick={handleTakePhoto}
          aria-label="Tomar fotografía"
          className="h-[72px] w-[72px] rounded-full border-[5px] border-mint bg-white shadow-xl transition active:scale-90 disabled:opacity-40"
        />

        <button
          type="button"
          onClick={() => {
            stopStream();
            onClose();
          }}
          className="flex flex-col items-center gap-1 text-[11px] font-semibold text-white/90 active:scale-95"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15">
            <X className="h-5 w-5" />
          </span>
          <span>Cancelar</span>
        </button>
      </div>
    </div>
  );
}
