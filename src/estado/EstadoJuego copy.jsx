import React, { createContext, useCallback, useContext, useMemo, useReducer } from "react";

/**
 * Estado global del juego
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
    name: "Daniel Alejandro Viasus",
    idClass: "",
    x: 0,
    y: 0,
    inicio: { x: 0, y: 0 },
    aspecto: "idle",
    velocidad: 250,
    ruta: [],
    colider: { ancho: 64, alto: 32, offsetX: 0, offsetY: 0 },

    vida: 2,
    escudos: 1,

    inventario: {
      superPosion: 3,
      posion: 2,
      monedas: 6,
      escudos: ["basico"],
    },
  },

  enemigos: {},

  // ✅ NUEVO: puntajes
  puntaje: {
    combateActual: 0, // se acumula solo dentro del combate actual
    total: 0, // suma de todos los combates (nivel / sesión)
  },

  // ✅ NUEVO: registro global de preguntas acertadas (no se repiten en el mundo)
  preguntas: {
    acertadasIds: [], // array de string ids (sin duplicados)
  },

  navegacion: {
    tamCelda: 14,
    margenEsquinas: 4,
    paddingX: 0,
    paddingY: 0,
  },

  debug: { activo: false },

  interaccionIndirecta: {
    activa: false,
    tecla: "E",
    zonaId: null,
  },

  ui: {
    plantillaActiva: null,
    inventario: {
      seleccionadoId: null,
    },
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
    // ======================
    // ENEMIGOS
    // ======================
    case "ENEMIGO_DERROTAR": {
      const id = String(accion.payload?.id || "");
      if (!id) return estado;

      const prev = estado.enemigos?.[id];
      if (prev?.derrotado) return estado;

      return {
        ...estado,
        enemigos: {
          ...(estado.enemigos || {}),
          [id]: { ...(prev || {}), derrotado: true },
        },
      };
    }

    // ======================
    // ✅ PUNTAJE (AURA)
    // Reglas:
    // - correcto: suma "puntos" (normalmente atkMult)
    // - incorrecto: resta la mitad de "puntos"
    // - nunca baja de 0
    // - huir: descarta combateActual
    // - cerrar con victoria/derrota: suma combateActual a total y resetea combateActual
    // ======================
    case "PUNTAJE_COMBATE_RESET": {
      if ((estado.puntaje?.combateActual ?? 0) === 0) return estado;
      return { ...estado, puntaje: { ...(estado.puntaje || {}), combateActual: 0 } };
    }

    case "PUNTAJE_COMBATE_APLICAR_TURNO": {
      const puntos = Math.floor(Number(accion.payload?.puntos ?? 0));
      const correcto = !!accion.payload?.correcto;

      if (!Number.isFinite(puntos) || puntos <= 0) return estado;

      const prev = Math.floor(Number(estado.puntaje?.combateActual ?? 0));

      // correcto: +puntos
      // incorrecto: -half(puntos) (redondeo hacia abajo)
      const delta = correcto ? puntos : -Math.floor(puntos / 2);

      const next = Math.max(0, prev + delta);
      if (next === prev) return estado;

      return { ...estado, puntaje: { ...(estado.puntaje || {}), combateActual: next } };
    }

    case "PUNTAJE_COMBATE_DESCARTAR": {
      // huir -> no se suma al total
      if ((estado.puntaje?.combateActual ?? 0) === 0) return estado;
      return { ...estado, puntaje: { ...(estado.puntaje || {}), combateActual: 0 } };
    }

    case "PUNTAJE_COMBATE_CERRAR_Y_SUMAR_TOTAL": {
      const combate = Math.floor(Number(estado.puntaje?.combateActual ?? 0));
      const totalPrev = Math.floor(Number(estado.puntaje?.total ?? 0));
      const totalNext = totalPrev + Math.max(0, combate);

      // resetea combateActual y suma a total
      return {
        ...estado,
        puntaje: {
          ...(estado.puntaje || {}),
          combateActual: 0,
          total: totalNext,
        },
      };
    }

    // ======================
    // ✅ PREGUNTAS (REGISTRO GLOBAL)
    // - Solo marcar cuando se acierta
    // - No duplicados
    // ======================
    case "PREGUNTA_MARCAR_ACERTADA": {
      const id = String(accion.payload?.id ?? "").trim();
      if (!id) return estado;

      const prevArr = Array.isArray(estado.preguntas?.acertadasIds)
        ? estado.preguntas.acertadasIds
        : [];

      if (prevArr.includes(id)) return estado;

      return {
        ...estado,
        preguntas: {
          ...(estado.preguntas || {}),
          acertadasIds: [...prevArr, id],
        },
      };
    }

    // ======================
    // VIDA / ESCUDOS COMBATE
    // ======================
    case "JUGADOR_RECIBIR_DANIO": {
      const puntos = Math.max(1, Number(accion.payload?.puntos ?? 1));

      let vida = Number(estado.jugador.vida ?? 0);
      let escudos = Number(estado.jugador.escudos ?? 0);

      for (let i = 0; i < puntos; i++) {
        if (escudos > 0) escudos -= 1;
        else if (vida > 0) vida -= 1;
      }

      if (vida === estado.jugador.vida && escudos === estado.jugador.escudos) return estado;

      return { ...estado, jugador: { ...estado.jugador, vida, escudos } };
    }

    case "JUGADOR_SET_VIDA": {
      const vida = Math.max(0, Math.floor(Number(accion.payload)));
      if (vida === estado.jugador.vida) return estado;
      return { ...estado, jugador: { ...estado.jugador, vida } };
    }

    case "JUGADOR_SET_ESCUDOS": {
      const escudos = Math.max(0, Math.floor(Number(accion.payload)));
      if (escudos === estado.jugador.escudos) return estado;
      return { ...estado, jugador: { ...estado.jugador, escudos } };
    }

    // ======================
    // INVENTARIO (NUMÉRICOS)
    // ======================
    case "JUGADOR_INVENTARIO_SET_ITEM": {
      const key = String(accion.payload?.key ?? "");
      const value = Math.max(0, Math.floor(Number(accion.payload?.value ?? 0)));
      if (!key) return estado;

      const invPrev = estado.jugador.inventario || {};
      const prevValue = Number(invPrev[key] ?? 0);
      if (prevValue === value) return estado;

      return {
        ...estado,
        jugador: { ...estado.jugador, inventario: { ...invPrev, [key]: value } },
      };
    }

    case "JUGADOR_INVENTARIO_ADD_ITEM": {
      const key = String(accion.payload?.key ?? "");
      const delta = Math.floor(Number(accion.payload?.delta ?? 0));
      if (!key || !Number.isFinite(delta) || delta === 0) return estado;

      const invPrev = estado.jugador.inventario || {};
      const prevValue = Math.floor(Number(invPrev[key] ?? 0));
      const nextValue = Math.max(0, prevValue + delta);

      if (prevValue === nextValue) return estado;

      return {
        ...estado,
        jugador: { ...estado.jugador, inventario: { ...invPrev, [key]: nextValue } },
      };
    }

    // ======================
    // INVENTARIO (ESCUDOS ARRAY)
    // ======================
    case "JUGADOR_INVENTARIO_ADD_ESCUDO_TIPO": {
      const tipo = String(accion.payload?.tipo ?? "").trim();
      if (!tipo) return estado;

      const invPrev = estado.jugador.inventario || {};
      const arrPrev = Array.isArray(invPrev.escudos) ? invPrev.escudos : [];
      if (arrPrev.includes(tipo)) return estado;

      return {
        ...estado,
        jugador: { ...estado.jugador, inventario: { ...invPrev, escudos: [...arrPrev, tipo] } },
      };
    }

    case "JUGADOR_INVENTARIO_REMOVE_ESCUDO_TIPO": {
      const tipo = String(accion.payload?.tipo ?? "").trim();
      if (!tipo) return estado;

      const invPrev = estado.jugador.inventario || {};
      const arrPrev = Array.isArray(invPrev.escudos) ? invPrev.escudos : [];
      if (!arrPrev.length) return estado;

      const nextArr = arrPrev.filter((t) => t !== tipo);
      if (nextArr.length === arrPrev.length) return estado;

      return {
        ...estado,
        jugador: { ...estado.jugador, inventario: { ...invPrev, escudos: nextArr } },
      };
    }

    // ======================
    // UI: PLANTILLAS
    // ======================
    case "UI_PLANTILLA_ABRIR": {
      const payload = accion.payload || null;

      const next = payload
        ? { id: String(payload.id), props: payload.props ?? {}, origenZonaId: payload.origenZonaId ?? null }
        : null;

      const prev = estado.ui?.plantillaActiva ?? null;

      if (!prev && !next) return estado;
      if (prev && next && prev.id === next.id && prev.origenZonaId === next.origenZonaId) return estado;

      return { ...estado, ui: { ...(estado.ui || {}), plantillaActiva: next } };
    }

    case "UI_PLANTILLA_CERRAR": {
      if (!estado.ui?.plantillaActiva) return estado;
      return { ...estado, ui: { ...(estado.ui || {}), plantillaActiva: null } };
    }

    // ======================
    // UI: INVENTARIO SELECCIÓN
    // ======================
    case "UI_INVENTARIO_SELECCIONAR": {
      const id = String(accion.payload?.id ?? "");
      if (!id) return estado;

      const prev = estado.ui?.inventario?.seleccionadoId ?? null;
      if (prev === id) return estado;

      return {
        ...estado,
        ui: {
          ...(estado.ui || {}),
          inventario: { ...(estado.ui?.inventario || {}), seleccionadoId: id },
        },
      };
    }

    case "UI_INVENTARIO_DESELECCIONAR": {
      const prev = estado.ui?.inventario?.seleccionadoId ?? null;
      if (!prev) return estado;

      return {
        ...estado,
        ui: {
          ...(estado.ui || {}),
          inventario: { ...(estado.ui?.inventario || {}), seleccionadoId: null },
        },
      };
    }

    // ======================
    // RESTO (POS, RUTA, ETC.)
    // ======================
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

    case "INTERACCION_INDIRECTA_SET": {
      const { activa, tecla, zonaId } = accion.payload || {};
      const next = {
        activa: !!activa,
        tecla: (tecla || "E").toString(),
        zonaId: zonaId ?? null,
      };

      const prev = estado.interaccionIndirecta;
      if (prev.activa === next.activa && prev.tecla === next.tecla && prev.zonaId === next.zonaId) {
        return estado;
      }

      return { ...estado, interaccionIndirecta: next };
    }

    case "INTERACCION_INDIRECTA_CLEAR": {
      if (!estado.interaccionIndirecta.activa && !estado.interaccionIndirecta.zonaId) return estado;
      return { ...estado, interaccionIndirecta: { activa: false, tecla: "E", zonaId: null } };
    }

    default:
      return estado;
  }
}

export function ProveedorEstadoJuego({ children }) {
  const [estado, dispatch] = useReducer(reducer, null, inicializarEstado);

  const derrotarEnemigo = useCallback((id) => {
    if (!id) return;
    dispatch({ type: "ENEMIGO_DERROTAR", payload: { id } });
  }, []);

  // vida/escudos/daño
  const jugadorRecibirDanio = useCallback((puntos = 1) => {
    dispatch({ type: "JUGADOR_RECIBIR_DANIO", payload: { puntos } });
  }, []);

  const setVidaJugador = useCallback((vida) => {
    dispatch({ type: "JUGADOR_SET_VIDA", payload: vida });
  }, []);

  const setEscudosJugador = useCallback((escudos) => {
    dispatch({ type: "JUGADOR_SET_ESCUDOS", payload: escudos });
  }, []);

  // ✅ puntaje
  const puntajeResetCombate = useCallback(() => {
    dispatch({ type: "PUNTAJE_COMBATE_RESET" });
  }, []);

  // ✅ aplica puntos por turno (correcto suma, incorrecto resta half)
  const puntajeAplicarTurno = useCallback(({ puntos = 0, correcto = false } = {}) => {
    dispatch({ type: "PUNTAJE_COMBATE_APLICAR_TURNO", payload: { puntos, correcto: !!correcto } });
  }, []);

  // ✅ huir => descarta combateActual
  const puntajeDescartarCombate = useCallback(() => {
    dispatch({ type: "PUNTAJE_COMBATE_DESCARTAR" });
  }, []);

  // ✅ victoria/derrota => suma a total
  const puntajeCerrarCombateYSumarTotal = useCallback(() => {
    dispatch({ type: "PUNTAJE_COMBATE_CERRAR_Y_SUMAR_TOTAL" });
  }, []);

  // ✅ preguntas globales
  const preguntaMarcarAcertada = useCallback((id) => {
    if (!id) return;
    dispatch({ type: "PREGUNTA_MARCAR_ACERTADA", payload: { id } });
  }, []);

  // inventario
  const inventarioSetItem = useCallback((key, value) => {
    if (!key) return;
    dispatch({ type: "JUGADOR_INVENTARIO_SET_ITEM", payload: { key, value } });
  }, []);

  const inventarioAgregarItem = useCallback((key, cantidad = 1) => {
    if (!key) return;
    const delta = Math.floor(Number(cantidad));
    if (!Number.isFinite(delta) || delta === 0) return;
    dispatch({ type: "JUGADOR_INVENTARIO_ADD_ITEM", payload: { key, delta } });
  }, []);

  const inventarioQuitarItem = useCallback((key, cantidad = 1) => {
    if (!key) return;
    const delta = -Math.abs(Math.floor(Number(cantidad)));
    if (!Number.isFinite(delta) || delta === 0) return;
    dispatch({ type: "JUGADOR_INVENTARIO_ADD_ITEM", payload: { key, delta } });
  }, []);

  const inventarioAgregarEscudoTipo = useCallback((tipo) => {
    if (!tipo) return;
    dispatch({ type: "JUGADOR_INVENTARIO_ADD_ESCUDO_TIPO", payload: { tipo } });
  }, []);

  const inventarioQuitarEscudoTipo = useCallback((tipo) => {
    if (!tipo) return;
    dispatch({ type: "JUGADOR_INVENTARIO_REMOVE_ESCUDO_TIPO", payload: { tipo } });
  }, []);

  // UI inventario selección
  const inventarioSeleccionar = useCallback((id) => {
    if (!id) return;
    dispatch({ type: "UI_INVENTARIO_SELECCIONAR", payload: { id } });
  }, []);

  const inventarioDeseleccionar = useCallback(() => {
    dispatch({ type: "UI_INVENTARIO_DESELECCIONAR" });
  }, []);

  // plantillas
  const abrirPlantilla = useCallback(({ id, props = {}, origenZonaId = null } = {}) => {
    if (!id) return;
    dispatch({ type: "UI_PLANTILLA_ABRIR", payload: { id, props, origenZonaId } });
  }, []);

  const cerrarPlantilla = useCallback(() => {
    dispatch({ type: "UI_PLANTILLA_CERRAR" });
  }, []);

  // otros
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

  const establecerInteraccionIndirecta = useCallback(
    ({ activa = true, tecla = "E", zonaId = null } = {}) => {
      dispatch({ type: "INTERACCION_INDIRECTA_SET", payload: { activa: !!activa, tecla, zonaId } });
    },
    []
  );

  const limpiarInteraccionIndirecta = useCallback(() => {
    dispatch({ type: "INTERACCION_INDIRECTA_CLEAR" });
  }, []);

  const acciones = useMemo(
    () => ({
      jugadorRecibirDanio,
      setVidaJugador,
      setEscudosJugador,

      derrotarEnemigo,

      // ✅ puntaje
      puntajeResetCombate,
      puntajeAplicarTurno,
      puntajeDescartarCombate,
      puntajeCerrarCombateYSumarTotal,

      // ✅ preguntas globales
      preguntaMarcarAcertada,

      inventarioSetItem,
      inventarioAgregarItem,
      inventarioQuitarItem,
      inventarioAgregarEscudoTipo,
      inventarioQuitarEscudoTipo,

      inventarioSeleccionar,
      inventarioDeseleccionar,

      abrirPlantilla,
      cerrarPlantilla,

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
    }),
    [
      jugadorRecibirDanio,
      setVidaJugador,
      setEscudosJugador,
      derrotarEnemigo,

      puntajeResetCombate,
      puntajeAplicarTurno,
      puntajeDescartarCombate,
      puntajeCerrarCombateYSumarTotal,

      preguntaMarcarAcertada,

      inventarioSetItem,
      inventarioAgregarItem,
      inventarioQuitarItem,
      inventarioAgregarEscudoTipo,
      inventarioQuitarEscudoTipo,
      inventarioSeleccionar,
      inventarioDeseleccionar,
      abrirPlantilla,
      cerrarPlantilla,
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
