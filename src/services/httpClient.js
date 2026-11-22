const DEFAULT_TIMEOUT_MS = 15000;

export function getApiBaseUrl() {
  const raw = import.meta.env.VITE_API_URL;
  if (raw === undefined) return 'http://localhost:8000';
  const trimmed = String(raw).trim();
  if (trimmed === '' || trimmed === '/' || trimmed.toLowerCase() === 'proxy') {
    return '';
  }
  return trimmed.replace(/\/+$/, '');
}

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'UNKNOWN_ERROR', details = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function extractServerErrorDetail(payload, status) {
  if (payload && typeof payload === 'object') {
    const rawDetail = payload.detail ?? payload.message;
    if (typeof rawDetail === 'string' && rawDetail.trim()) {
      return rawDetail.trim();
    }
    if (Array.isArray(rawDetail) && rawDetail.length > 0) {
      const joined = rawDetail
        .map((item) => (typeof item === 'string' ? item : item?.msg || JSON.stringify(item)))
        .filter(Boolean)
        .join('. ');
      if (joined) return joined;
    }
    if (rawDetail && typeof rawDetail === 'object') {
      return rawDetail.message || JSON.stringify(rawDetail);
    }
  }
  if (typeof payload === 'string' && payload.trim()) {
    return payload.trim();
  }
  return `El servidor respondió con estado ${status}.`;
}

/**
 * Base HTTP client wrapping fetch against VITE_API_URL with timeout and
 * FastAPI-friendly error normalization.
 * @param {string} path
 * @param {RequestInit & { timeoutMs?: number }} options
 */
export async function httpRequest(path, options = {}) {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal: externalSignal, headers, body, ...rest } =
    options;

  const baseUrl = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${baseUrl}${normalizedPath}`;

  const controller = new AbortController();
  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(timer);
      throw new ApiError('Solicitud cancelada.', { code: 'ABORTED' });
    }
    externalSignal.addEventListener('abort', onExternalAbort, { once: true });
  }

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const finalHeaders = new Headers(headers || {});
  if (!isFormData && body && !finalHeaders.has('Content-Type')) {
    finalHeaders.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(url, {
      ...rest,
      body,
      headers: finalHeaders,
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const payload = isJson ? await response.json().catch(() => null) : await response.text().catch(() => '');

    if (!response.ok) {
      const serverDetail = extractServerErrorDetail(payload, response.status);

      throw new ApiError(serverDetail, {
        status: response.status,
        code: 'HTTP_ERROR',
        details: payload,
      });
    }

    return payload;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error?.name === 'AbortError') {
      if (timedOut) {
        throw new ApiError(
          `Tiempo de espera agotado al conectar con ${baseUrl}. Intenta de nuevo.`,
          { code: 'TIMEOUT' }
        );
      }
      throw new ApiError('Solicitud cancelada.', { code: 'ABORTED' });
    }

    throw new ApiError(
      `No se pudo conectar con el backend (${baseUrl}). Verifica que FastAPI esté encendido o activa el Modo Mock.`,
      { code: 'NETWORK_ERROR', details: error?.message }
    );
  } finally {
    clearTimeout(timer);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  }
}
