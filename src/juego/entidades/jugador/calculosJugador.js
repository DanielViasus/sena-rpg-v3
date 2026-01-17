export function calcularGeometriaJugador({
  piesX,
  piesY,
  spriteAncho,
  spriteAlto,
  coliderAncho,
  coliderAlto,
  coliderOffsetX = 0,
  coliderOffsetY = 0,
}) {
  const coliderLeft = Math.round((spriteAncho - coliderAncho) / 2 + coliderOffsetX);
  const coliderTop = Math.round(spriteAlto - coliderAlto + coliderOffsetY);

  const piesXLocal = coliderLeft + coliderAncho / 2;
  const piesYLocal = coliderTop + coliderAlto;

  const spriteLeft = Math.round(piesX - piesXLocal);
  const spriteTop = Math.round(piesY - piesYLocal);

  const coliderMundo = {
    x: spriteLeft + coliderLeft,
    y: spriteTop + coliderTop,
    ancho: coliderAncho,
    alto: coliderAlto,
  };

  const zIndex = Math.floor(piesY - coliderAlto / 2); // centro del collider en Y

  return { spriteLeft, spriteTop, coliderLeft, coliderTop, piesXLocal, piesYLocal, coliderMundo, zIndex };
}
