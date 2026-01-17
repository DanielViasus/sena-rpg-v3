export function calcularGeometriaObjeto({
  x,
  y,
  ancho,
  alto,

  // Punto de referencia dentro del sprite (por defecto centro-abajo)
  pivoteX = Math.round(ancho / 2),
  pivoteY = alto,

  // BoxCollider relativo al pivote: { ancho, alto, offsetX, offsetY }
  colider = null,

  // Ajuste fino de z (sube/baja la profundidad)
  offsetZ = 0,
}) {
  // Top-left del sprite en mundo (a partir del pivote)
  const spriteLeft = Math.round(x - pivoteX);
  const spriteTop = Math.round(y - pivoteY);

  // Collider por defecto si no envías uno
  const coliderFinal = colider ?? {
    ancho: Math.max(10, Math.round(ancho * 0.6)),
    alto: Math.max(8, Math.round(alto * 0.2)),
    offsetX: 0,
    offsetY: 0,
  };

  const offsetX = coliderFinal.offsetX ?? 0;
  const offsetY = coliderFinal.offsetY ?? 0;

  // Posición del collider dentro del sprite (local)
  // - centrado en X sobre el pivote
  // - pegado al suelo (pivoteY) en Y
  const coliderLeft = Math.round(pivoteX - coliderFinal.ancho / 2 + offsetX);
  const coliderTop = Math.round(pivoteY - coliderFinal.alto + offsetY);

  const coliderMundo = {
    x: spriteLeft + coliderLeft,
    y: spriteTop + coliderTop,
    ancho: coliderFinal.ancho,
    alto: coliderFinal.alto,
  };

  // ✅ zIndex desde el centro del BoxCollider (en mundo) + offsetZ
  const centroColiderY = coliderMundo.y + coliderMundo.alto / 2;
  const zIndex = Math.floor(centroColiderY + offsetZ);

  return {
    spriteLeft,
    spriteTop,
    zIndex,
    centroColiderY,

    pivoteLocal: { x: pivoteX, y: pivoteY },
    pivoteMundo: { x: Math.round(x), y: Math.round(y) },

    coliderLocal: {
      x: coliderLeft,
      y: coliderTop,
      ancho: coliderFinal.ancho,
      alto: coliderFinal.alto,
    },
    coliderMundo,
  };
}
