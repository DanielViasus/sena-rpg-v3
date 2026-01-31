// src/estado/selectorDeAspecto.jsx

// ✅ Importa aquí TODAS las skins (una sola vez)
import skinDefaultIdle from "../assets/svg/personajes/jugador/gifIdle_128x128_200ms.webp";


// Ejemplo: rival / otros (si aplica)
// import skinCalaveraIdle from "../assets/personajes/calavera/idle.webp";

const MAPA_ASPECTOS = {
  DEFAULT: {
    idle: skinDefaultIdle,
    walk: skinDefaultWalk,
  },
  ISAIAS: {
    idle: skinIsaiasIdle,
    walk: skinIsaiasWalk,
  },
  // CALAVERA: { idle: skinCalaveraIdle, walk: ... },
};

/**
 * selectorDeAspecto
 * @param {string} aspecto - estado.jugador.aspecto (ej: "ISAIAS")
 * @param {string} anim - "idle" | "walk" (default "idle")
 * @returns {string} url del asset (import)
 */
export function selectorDeAspecto(aspecto, anim = "idle") {
  const key = (aspecto || "DEFAULT").toString().toUpperCase();
  const set = MAPA_ASPECTOS[key] || MAPA_ASPECTOS.DEFAULT;

  // fallback por si falta la animación en ese set
  return set?.[anim] || MAPA_ASPECTOS.DEFAULT?.[anim] || null;
}

/**
 * (Opcional) si quieres obtener TODO el pack
 * @returns {{idle:string, walk:string}}
 */
export function selectorPackAspecto(aspecto) {
  const key = (aspecto || "DEFAULT").toString().toUpperCase();
  return MAPA_ASPECTOS[key] || MAPA_ASPECTOS.DEFAULT;
}
