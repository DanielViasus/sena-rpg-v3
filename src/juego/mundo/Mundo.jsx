// src/juego/mundo/Mundo.jsx
import { useEffect, useMemo, useRef } from "react";

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function sampleDelay(buffer, tObjetivo) {
  const n = buffer.length;
  if (!n) return null;

  if (tObjetivo <= buffer[0].t) return { x: buffer[0].x, y: buffer[0].y };
  const last = buffer[n - 1];
  if (tObjetivo >= last.t) return { x: last.x, y: last.y };

  for (let i = 1; i < n; i++) {
    const a = buffer[i - 1];
    const b = buffer[i];
    if (tObjetivo >= a.t && tObjetivo <= b.t) {
      const span = b.t - a.t || 1;
      const k = (tObjetivo - a.t) / span;
      return {
        x: a.x + (b.x - a.x) * k,
        y: a.y + (b.y - a.y) * k,
      };
    }
  }
  return { x: last.x, y: last.y };
}

export default function Mundo({
  ancho,
  largo,
  bg,
  children,
  pantallaCompleta = false,
  altoViewport = 520,
  mostrarBorde = true,
  alClickMundo,

  // Cámara (opcional)
  camara = null,
}) {
  const refViewport = useRef(null);
  const refSuperficie = useRef(null);

  // Tamaño real del viewport
  const viewRef = useRef({ w: 0, h: 0 });

  // Objetivo actual
  const targetRef = useRef({ x: ancho / 2, y: largo / 2 });

  // Config cámara (refs para evitar re-renders)
  const cfgRef = useRef({
    enabled: false,
    delayMs: 300,
    suavizadoMs: 160,
    offsetX: 0,
    offsetY: 0,
    clampBordes: true,
    margenX: 200,
    margenY: 200,
  });

  // Posición de cámara (en coordenadas de mundo)
  const camPosRef = useRef({ x: ancho / 2, y: largo / 2 });

  // Buffer para delay
  const bufferRef = useRef([]); // [{t,x,y}, ...]

  // RAF control (evita doble loop con StrictMode)
  const rafRef = useRef(null);
  const corriendoRef = useRef(false);

  // Aplicar config (dependencias primitivas para no recalcular por objeto nuevo)
  useEffect(() => {
    const c = camara || null;

    if (!c) {
      cfgRef.current.enabled = false;
      return;
    }

    cfgRef.current.enabled = true;
    cfgRef.current.delayMs = Number.isFinite(c.delayMs) ? Math.max(0, c.delayMs) : 300;
    cfgRef.current.suavizadoMs = Number.isFinite(c.suavizadoMs) ? Math.max(0, c.suavizadoMs) : 160;
    cfgRef.current.offsetX = Number.isFinite(c.offsetX) ? c.offsetX : 0;
    cfgRef.current.offsetY = Number.isFinite(c.offsetY) ? c.offsetY : 0;
    cfgRef.current.clampBordes = c.clampBordes !== false;

    cfgRef.current.margenX = Number.isFinite(c.margenX) ? Math.max(0, c.margenX) : 200;
    cfgRef.current.margenY = Number.isFinite(c.margenY) ? Math.max(0, c.margenY) : 200;

    if (c.objetivo && Number.isFinite(c.objetivo.x) && Number.isFinite(c.objetivo.y)) {
      targetRef.current = { x: c.objetivo.x, y: c.objetivo.y };
    }
  }, [
    camara?.delayMs,
    camara?.suavizadoMs,
    camara?.offsetX,
    camara?.offsetY,
    camara?.clampBordes,
    camara?.margenX,
    camara?.margenY,
    camara?.objetivo?.x,
    camara?.objetivo?.y,
  ]);

  // Si cambian ancho/largo, reseteo base
  useEffect(() => {
    camPosRef.current = { x: ancho / 2, y: largo / 2 };
    targetRef.current = { x: ancho / 2, y: largo / 2 };
    bufferRef.current = [];
  }, [ancho, largo]);

  // Medir viewport
  useEffect(() => {
    const el = refViewport.current;
    if (!el) return;

    const medir = () => {
      const r = el.getBoundingClientRect();
      viewRef.current = { w: r.width, h: r.height };
    };

    medir();

    let ro = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => medir());
      ro.observe(el);
    } else {
      window.addEventListener("resize", medir);
    }

    return () => {
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", medir);
    };
  }, []);

  // Mantener targetRef actualizado sin romper RAF
  useEffect(() => {
    if (!camara?.objetivo) return;
    const { x, y } = camara.objetivo;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    targetRef.current = { x, y };
  }, [camara?.objetivo?.x, camara?.objetivo?.y]);

  // Loop cámara
  useEffect(() => {
    if (corriendoRef.current) return;
    corriendoRef.current = true;

    let last = performance.now();

    const tick = (t) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;

      const superficie = refSuperficie.current;
      if (!superficie) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const { w: vw, h: vh } = viewRef.current;
      if (!vw || !vh) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const cfg = cfgRef.current;

      let tx = 0;
      let ty = 0;

      if (cfg.enabled) {
        // 1) buffer de objetivo
        const tar = targetRef.current;
        const now = t;

        bufferRef.current.push({ t: now, x: tar.x, y: tar.y });

        const maxKeep = cfg.delayMs + 1200;
        while (bufferRef.current.length && now - bufferRef.current[0].t > maxKeep) {
          bufferRef.current.shift();
        }

        // 2) objetivo con delay
        const delayed = sampleDelay(bufferRef.current, now - cfg.delayMs) || tar;

        // 3) offsets
        const deseadoX = delayed.x + cfg.offsetX;
        const deseadoY = delayed.y + cfg.offsetY;

        // 4) clamp a “universo” (mundo extendido por márgenes)
        let clampedX = deseadoX;
        let clampedY = deseadoY;

        if (cfg.clampBordes) {
          const halfW = vw / 2;
          const halfH = vh / 2;

          const mX = cfg.margenX;
          const mY = cfg.margenY;

          // Universo: [-margen, ancho+margen] y [-margen, largo+margen]
          const minX = -mX;
          const maxX = ancho + mX;
          const minY = -mY;
          const maxY = largo + mY;

          const minCamX = minX + halfW;
          const maxCamX = maxX - halfW;
          const minCamY = minY + halfH;
          const maxCamY = maxY - halfH;

          if (minCamX <= maxCamX) clampedX = clamp(deseadoX, minCamX, maxCamX);
          else clampedX = deseadoX;

          if (minCamY <= maxCamY) clampedY = clamp(deseadoY, minCamY, maxCamY);
          else clampedY = deseadoY;
        }

        // 5) suavizado exponencial
        const suav = cfg.suavizadoMs;
        const alpha = suav <= 0 ? 1 : 1 - Math.exp((-dt * 1000) / suav);

        const cam = camPosRef.current;
        cam.x = cam.x + (clampedX - cam.x) * alpha;
        cam.y = cam.y + (clampedY - cam.y) * alpha;

        // 6) translate del mundo
        tx = vw / 2 - cam.x;
        ty = vh / 2 - cam.y;
      } else {
        // sin cámara: centrar mundo
        tx = (vw - ancho) / 2;
        ty = (vh - largo) / 2;
      }

      superficie.style.transform = `translate3d(${Math.round(tx)}px, ${Math.round(ty)}px, 0)`;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      corriendoRef.current = false;
    };
  }, [ancho, largo]);

  // Estilos
  const estiloViewport = useMemo(() => {
    if (pantallaCompleta) {
      return {
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#0f1115",
        border: mostrarBorde ? "1px solid #333" : "none",
      };
    }

    return {
      position: "relative",
      width: "100%",
      height: `${altoViewport}px`,
      overflow: "hidden",
      background: "#0f1115",
      border: mostrarBorde ? "1px solid #333" : "none",
      borderRadius: 8,
    };
  }, [pantallaCompleta, altoViewport, mostrarBorde]);

  const estiloSuperficie = useMemo(
    () => ({
      position: "absolute",
      left: 0,
      top: 0,
      width: `${ancho}px`,
      height: `${largo}px`,
      backgroundColor: "#141821",
      backgroundImage: bg ? `url(${bg})` : "none",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "top left",
      backgroundSize: "100% 100%",
      userSelect: "none",
      willChange: "transform",
      transform: "translate3d(0,0,0)",
    }),
    [ancho, largo, bg]
  );

  function obtenerCoordsDesdeEvento(e) {
    const el = refSuperficie.current;
    if (!el) return null;

    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    return { x, y };
  }

  function onMouseDown(e) {
    if (!alClickMundo) return;

    const p = obtenerCoordsDesdeEvento(e);
    if (!p) return;

    // Ignorar clicks fuera del mundo (coordenadas mundo reales)
    if (p.x < 0 || p.y < 0 || p.x > ancho || p.y > largo) return;

    alClickMundo({ x: p.x, y: p.y, evento: e });
  }

  return (
    <div ref={refViewport} style={estiloViewport}>
      <div ref={refSuperficie} style={estiloSuperficie} onMouseDown={onMouseDown}>
        {children}
      </div>
    </div>
  );
}
