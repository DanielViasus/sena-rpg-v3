// src/juego/sistema/useMarcaClick.jsx
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useMarcaClick
 * - Permite "marcar" un punto (x,y) y mantenerlo visible por duracionMs.
 * - Si se vuelve a hacer click, reemplaza la marca y reinicia el timer.
 */
export function useMarcaClick({ duracionMs = 1000 } = {}) {
  const [marca, setMarca] = useState(null); // { x, y, key }
  const timeoutRef = useRef(null);
  const durRef = useRef(duracionMs);

  useEffect(() => {
    durRef.current = Number.isFinite(duracionMs) ? Math.max(0, duracionMs) : 1000;
  }, [duracionMs]);

  const limpiar = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    setMarca(null);
  }, []);

  const marcar = useCallback(({ x, y }) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;

    // reinicia timer
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;

    // key para forzar re-render si el usuario clickea el mismo punto
    setMarca({ x, y, key: `${Date.now()}_${Math.random().toString(16).slice(2)}` });

    const d = durRef.current;
    if (d > 0) {
      timeoutRef.current = setTimeout(() => {
        setMarca(null);
        timeoutRef.current = null;
      }, d);
    }
  }, []);

  // cleanup al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    };
  }, []);

  return { marca, marcar, limpiar };
}
