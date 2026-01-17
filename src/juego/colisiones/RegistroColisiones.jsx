import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

/**
 * RegistroColisiones
 * - Guarda colliders en un Map(id -> { rect, meta })
 * - Mantiene "version" que incrementa en cada cambio
 *   para forzar recomputes (A* / caches / memos).
 */

const CtxRegistroColisiones = createContext(null);

export function ProveedorRegistroColisiones({ children }) {
  const registroRef = useRef(new Map()); // Map<string, { rect, meta }>
  const [version, setVersion] = useState(0);

  const upsertCollider = useCallback((id, rect, meta = {}) => {
    if (!id || !rect) return;

    // Normalización defensiva
    const r = {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      ancho: Math.round(rect.ancho),
      alto: Math.round(rect.alto),
    };

    registroRef.current.set(id, { rect: r, meta });
    setVersion((v) => v + 1);
  }, []);

  const removeCollider = useCallback((id) => {
    if (!id) return;
    const had = registroRef.current.delete(id);
    if (had) setVersion((v) => v + 1);
  }, []);

  const value = useMemo(() => {
    return {
      registro: registroRef.current,
      version,
      upsertCollider,
      removeCollider,
    };
  }, [version, upsertCollider, removeCollider]);

  return <CtxRegistroColisiones.Provider value={value}>{children}</CtxRegistroColisiones.Provider>;
}

function useCtx() {
  const ctx = useContext(CtxRegistroColisiones);
  if (!ctx) {
    throw new Error("useRegistroColisiones debe usarse dentro de <ProveedorRegistroColisiones>.");
  }
  return ctx;
}

// Devuelve el Map (estable). Ojo: para reaccionar a cambios usa useVersionRegistroColisiones().
export function useRegistroColisiones() {
  return useCtx().registro;
}

// Incrementa en cada cambio del registro (upsert/remove)
export function useVersionRegistroColisiones() {
  return useCtx().version;
}

export function useAccionesRegistroColisiones() {
  const { upsertCollider, removeCollider } = useCtx();
  return { upsertCollider, removeCollider };
}
