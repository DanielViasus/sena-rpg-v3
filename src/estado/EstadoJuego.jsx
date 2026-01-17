import React, { createContext, useCallback, useContext, useMemo, useReducer } from "react";

/**
 * Estado global del juego
 * - jugador.x,y ANCLADOS A PIES
 * - navegacion.paddingX/paddingY se recalculan desde colider + margenEsquinas
 * - interaccionIndirecta: estado UI para zonas indirectas (icono, tecla, zona activa)
 */

const EstadoJuegoContext = createContext(null);
const AccionesJuegoContext = createContext(null);

function recalcularPadding(navegacion, coliderJugador) {
  const margen = Math.max(0, navegacion.margenEsquinas ?? 0);
  const col = coliderJugador ?? { ancho: 64, alto: 32, offsetX: 0, offsetY: 0 };

  const paddingX = Math.ceil(col.ancho / 2 + margen);
  const paddingY = Math.ceil(col.alto / 2 + margen);

  return { paddingX, paddingY };
}

const ESTADO_INICIAL_BASE = {
  jugador: {
    x: 0,
    y: 0,
    inicio: { x: 0, y: 0 },
    aspecto: "idle",
    velocidad: 250,
    ruta: [],
    colider: { ancho: 64, alto: 32, offsetX: 0, offsetY: 0 },
  },
  navegacion: {
    tamCelda: 14,
    margenEsquinas: 4,
    paddingX: 0,
    paddingY: 0,
  },
  debug: { activo: false },

  // ✅ NUEVO: UI/estado para interacción indirecta
  interaccionIndirecta: {
    activa: false,
    tecla: "E",
    zonaId: null,
  },
};

function inicializarEstado() {
  const { paddingX, paddingY } = recalcularPadding(
    ESTADO_INICIAL_BASE.navegacion,
    ESTADO_INICIAL_BASE.jugador.colider
  );
  return {
    ...ESTADO_INICIAL_BASE,
    navegacion: { ...ESTADO_INICIAL_BASE.navegacion, paddingX, paddingY },
  };
}

function reducer(estado, accion) {
  switch (accion.type) {
    case "JUGADOR_POS": {
      const { x, y } = accion.payload;
      if (estado.jugador.x === x && estado.jugador.y === y) return estado;
      return { ...estado, jugador: { ...estado.jugador, x, y } };
    }

    case "JUGADOR_GUARDAR_INICIO": {
      const { x, y } = accion.payload;
      if (estado.jugador.inicio?.x === x && estado.jugador.inicio?.y === y) return estado;
      return { ...estado, jugador: { ...estado.jugador, inicio: { x, y } } };
    }

    case "JUGADOR_RUTA": {
      const ruta = Array.isArray(accion.payload) ? accion.payload : [];
      return { ...estado, jugador: { ...estado.jugador, ruta } };
    }

    case "JUGADOR_RUTA_LIMPIAR": {
      if (!estado.jugador.ruta?.length) return estado;
      return { ...estado, jugador: { ...estado.jugador, ruta: [] } };
    }

    case "JUGADOR_VELOCIDAD": {
      const vel = Number(accion.payload);
      if (!Number.isFinite(vel) || vel <= 0) return estado;
      if (estado.jugador.velocidad === vel) return estado;
      return { ...estado, jugador: { ...estado.jugador, velocidad: vel } };
    }

    case "JUGADOR_ASPECTO": {
      const aspecto = accion.payload;
      if (estado.jugador.aspecto === aspecto) return estado;
      return { ...estado, jugador: { ...estado.jugador, aspecto } };
    }

    case "JUGADOR_COLIDER": {
      const colider = accion.payload;
      const nuevoJugador = { ...estado.jugador, colider: { ...estado.jugador.colider, ...colider } };
      const { paddingX, paddingY } = recalcularPadding(estado.navegacion, nuevoJugador.colider);

      const mismo =
        nuevoJugador.colider.ancho === estado.jugador.colider.ancho &&
        nuevoJugador.colider.alto === estado.jugador.colider.alto &&
        (nuevoJugador.colider.offsetX ?? 0) === (estado.jugador.colider.offsetX ?? 0) &&
        (nuevoJugador.colider.offsetY ?? 0) === (estado.jugador.colider.offsetY ?? 0) &&
        paddingX === estado.navegacion.paddingX &&
        paddingY === estado.navegacion.paddingY;

      if (mismo) return estado;

      return {
        ...estado,
        jugador: nuevoJugador,
        navegacion: { ...estado.navegacion, paddingX, paddingY },
      };
    }

    case "NAVEGACION_CONFIG": {
      const patch = accion.payload ?? {};
      const nuevaNav = { ...estado.navegacion, ...patch };
      const { paddingX, paddingY } = recalcularPadding(nuevaNav, estado.jugador.colider);

      const mismo =
        nuevaNav.tamCelda === estado.navegacion.tamCelda &&
        nuevaNav.margenEsquinas === estado.navegacion.margenEsquinas &&
        paddingX === estado.navegacion.paddingX &&
        paddingY === estado.navegacion.paddingY;

      if (mismo) return estado;

      return { ...estado, navegacion: { ...nuevaNav, paddingX, paddingY } };
    }

    case "DEBUG_SET": {
      const activo = !!accion.payload;
      if (estado.debug.activo === activo) return estado;
      return { ...estado, debug: { ...estado.debug, activo } };
    }

    // ✅ NUEVO: set/clear interacción indirecta
    case "INTERACCION_INDIRECTA_SET": {
      const { activa, tecla, zonaId } = accion.payload || {};
      const next = {
        activa: !!activa,
        tecla: (tecla || "E").toString(),
        zonaId: zonaId ?? null,
      };

      const prev = estado.interaccionIndirecta;
      if (
        prev.activa === next.activa &&
        prev.tecla === next.tecla &&
        prev.zonaId === next.zonaId
      ) {
        return estado;
      }

      return { ...estado, interaccionIndirecta: next };
    }

    case "INTERACCION_INDIRECTA_CLEAR": {
      if (!estado.interaccionIndirecta.activa && !estado.interaccionIndirecta.zonaId) return estado;
      return {
        ...estado,
        interaccionIndirecta: { activa: false, tecla: "E", zonaId: null },
      };
    }

    default:
      return estado;
  }
}

export function ProveedorEstadoJuego({ children }) {
  const [estado, dispatch] = useReducer(reducer, null, inicializarEstado);

  const establecerPosicionJugador = useCallback((x, y) => {
    dispatch({ type: "JUGADOR_POS", payload: { x: Math.round(x), y: Math.round(y) } });
  }, []);

  const guardarInicioJugador = useCallback((x, y) => {
    dispatch({ type: "JUGADOR_GUARDAR_INICIO", payload: { x: Math.round(x), y: Math.round(y) } });
  }, []);

  const establecerRutaJugador = useCallback((ruta) => {
    dispatch({ type: "JUGADOR_RUTA", payload: Array.isArray(ruta) ? ruta : [] });
  }, []);

  const limpiarRutaJugador = useCallback(() => {
    dispatch({ type: "JUGADOR_RUTA_LIMPIAR" });
  }, []);

  const establecerVelocidadJugador = useCallback((vel) => {
    dispatch({ type: "JUGADOR_VELOCIDAD", payload: vel });
  }, []);

  const establecerAspectoJugador = useCallback((aspecto) => {
    dispatch({ type: "JUGADOR_ASPECTO", payload: aspecto });
  }, []);

  const establecerColiderJugador = useCallback((colider) => {
    dispatch({ type: "JUGADOR_COLIDER", payload: colider });
  }, []);

  const configurarNavegacion = useCallback((patch) => {
    dispatch({ type: "NAVEGACION_CONFIG", payload: patch });
  }, []);

  const establecerDebug = useCallback((activo) => {
    dispatch({ type: "DEBUG_SET", payload: activo });
  }, []);

  // ✅ NUEVO
  const establecerInteraccionIndirecta = useCallback(({ activa = true, tecla = "E", zonaId = null } = {}) => {
    dispatch({
      type: "INTERACCION_INDIRECTA_SET",
      payload: { activa: !!activa, tecla, zonaId },
    });
  }, []);

  const limpiarInteraccionIndirecta = useCallback(() => {
    dispatch({ type: "INTERACCION_INDIRECTA_CLEAR" });
  }, []);

  const acciones = useMemo(
    () => ({
      establecerPosicionJugador,
      guardarInicioJugador,
      establecerRutaJugador,
      limpiarRutaJugador,
      establecerVelocidadJugador,
      establecerAspectoJugador,
      establecerColiderJugador,
      configurarNavegacion,
      establecerDebug,

      // ✅ NUEVO
      establecerInteraccionIndirecta,
      limpiarInteraccionIndirecta,
    }),
    [
      establecerPosicionJugador,
      guardarInicioJugador,
      establecerRutaJugador,
      limpiarRutaJugador,
      establecerVelocidadJugador,
      establecerAspectoJugador,
      establecerColiderJugador,
      configurarNavegacion,
      establecerDebug,
      establecerInteraccionIndirecta,
      limpiarInteraccionIndirecta,
    ]
  );

  return (
    <EstadoJuegoContext.Provider value={estado}>
      <AccionesJuegoContext.Provider value={acciones}>{children}</AccionesJuegoContext.Provider>
    </EstadoJuegoContext.Provider>
  );
}

export function useEstadoJuego() {
  const ctx = useContext(EstadoJuegoContext);
  if (!ctx) throw new Error("useEstadoJuego debe usarse dentro de ProveedorEstadoJuego");
  return ctx;
}

export function useAccionesJuego() {
  const ctx = useContext(AccionesJuegoContext);
  if (!ctx) throw new Error("useAccionesJuego debe usarse dentro de ProveedorEstadoJuego");
  return ctx;
}
