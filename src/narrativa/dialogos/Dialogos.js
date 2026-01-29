export const DIALOGOS = {
  Isaias: {
    aperturaPortal: [
      "Hola, eres el último estudiante que se presenta a la prueba.",
      "Necesito que agregues tus evidencias para ver si el portal se activa.",
      "Si se activa el portal, ven a verme.",
    ],
    portalAbierto: [
      "Muy bien hecho, hemos conseguido activar el portal.",
      "Este portal nos servirá para acceder a un mundo donde podremos derrotar a Zhoor.",
      "Con tu experiencia y conocimiento podremos derrotarlo.",
    ],
  },
};

export function obtenerLineasDialogo(dialogoId, secuenciaId) {
  const d = DIALOGOS?.[dialogoId];
  const arr = d?.[secuenciaId];
  return Array.isArray(arr) ? arr : [];
}
