// src/estado/selectorDeAspecto.jsx

// =======================
// JUGADOR (skins)
// =======================
import skinDefaultIdle from "../assets/svg/personajes/jugador/caballero/caballero_animado_220ms.webp";
import skinDefaultWalk from "../assets/svg/personajes/jugador/caballero/caballero_movimiento_animado_220ms_v3.webp";
import skinCrockIdle from "../assets/svg/personajes/jugador/gifIdle_128x128_200ms.webp";
import skinCrockWalk from "../assets/svg/personajes/jugador/gifWalk_128x128_200ms.webp";

// Ejemplo ISAIAS (ajusta a tus rutas reales si existen)
// import skinIsaiasIdle from "../assets/svg/personajes/isaias/gifIdle_128x128_200ms.webp";
// import skinIsaiasWalk from "../assets/svg/personajes/isaias/gifWalk_128x128_200ms.webp";

// Por ahora para no romper si no tienes assets distintos:
const skinIsaiasIdle = skinDefaultIdle;
const skinIsaiasWalk = skinDefaultWalk;

// =======================
// RIVALES (familias / tiers)
// =======================
// ✅ Ajusta rutas/nombres a los tuyos:
import rivalCalavera1 from "../assets/gif/personajes/rivales/calavera/calaveraCaminando.webp";
import rivalCalavera2 from "../assets/gif/personajes/rivales/calavera/calaveraCaminando.webp";

// (Opcional) derrotado por tier (si lo tienes):
import rivalCalavera1Derrotado from "../assets/gif/personajes/rivales/calavera/calaveraDerrotada.webp";
import rivalCalavera2Derrotado from "../assets/gif/personajes/rivales/calavera/calaveraDerrotada.webp";

// Si aún no existen esos archivos, puedes comentar los imports “derrotado”
// y dejarlo como null en el mapa.

// =======================
// MAPA
// =======================
const MAPA_ASPECTOS = {
  // ✅ RIVALES: por familia + tier
  RIVAL: {
    CALAVERA: {
      1: {
        idle: rivalCalavera1,
        derrotado: rivalCalavera1Derrotado ?? null,
      },
      2: {
        idle: rivalCalavera2,
        derrotado: rivalCalavera2Derrotado ?? null,
      },
    },
  },

  // ✅ JUGADOR
  DEFAULT: {
    idle: skinDefaultIdle,
    walk: skinDefaultWalk,
  },
  ISAIAS: {
    idle: skinIsaiasIdle,
    walk: skinIsaiasWalk,
  },
};

// =======================
// SELECTOR JUGADOR
// =======================
/**
 * selectorDeAspecto (jugador)
 * @param {string} aspecto - estado.jugador.aspecto (ej: "ISAIAS")
 * @param {string} anim - "idle" | "walk" (default "idle")
 * @returns {string|null}
 */
export function selectorDeAspecto(aspecto, anim = "idle") {
  const key = (aspecto || "DEFAULT").toString().toUpperCase();
  const set = MAPA_ASPECTOS[key] || MAPA_ASPECTOS.DEFAULT;

  // fallback por si falta la animación en ese set
  return set?.[anim] || MAPA_ASPECTOS.DEFAULT?.[anim] || null;
}

/**
 * selectorPackAspecto (jugador)
 * @returns {{idle?:string, walk?:string}}
 */
export function selectorPackAspecto(aspecto) {
  const key = (aspecto || "DEFAULT").toString().toUpperCase();
  return MAPA_ASPECTOS[key] || MAPA_ASPECTOS.DEFAULT;
}

// =======================
// SELECTOR RIVAL
// =======================
/**
 * selectorDeRival
 * @param {string} familia - ej: "CALAVERA"
 * @param {number|string} tier - ej: 1, 2, 3...
 * @param {string} anim - ej: "idle" | "walk" | "attack" | "defend" | "derrotado"
 * @returns {string|null}
 */
export function selectorDeRival(familia, tier = 1, anim = "idle") {
  const famKey = (familia || "").toString().toUpperCase().trim();
  const tierKey = String(Math.max(1, Math.round(Number(tier) || 1)));

  const fam = MAPA_ASPECTOS.RIVAL?.[famKey];
  const set = fam?.[tierKey] || fam?.[1] || null;

  // fallback: si no existe el anim en ese tier, intenta idle
  return set?.[anim] || set?.idle || null;
}

/**
 * (Opcional) pack completo del rival por tier
 */
export function selectorPackRival(familia, tier = 1) {
  const famKey = (familia || "").toString().toUpperCase().trim();
  const tierKey = String(Math.max(1, Math.round(Number(tier) || 1)));

  const fam = MAPA_ASPECTOS.RIVAL?.[famKey];
  return fam?.[tierKey] || fam?.[1] || null;
}
