// src/juego/navegacion/aestrella.js

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function idx(grilla, x, y) {
  return y * grilla.cols + x;
}

export function esCeldaLibre(grilla, x, y) {
  if (x < 0 || y < 0 || x >= grilla.cols || y >= grilla.rows) return false;
  return grilla.bloqueada[idx(grilla, x, y)] === 0;
}

/**
 * Crea una grilla de colisiones por celdas.
 * Obstáculos se inflan por paddingX/paddingY (margen de seguridad del jugador).
 *
 * CAMBIO IMPORTANTE:
 * - Antes: marcaba bloqueado si el CENTRO de la celda estaba dentro del obstáculo.
 * - Ahora: marca bloqueado si la CELDA (su rect) INTERSECA el obstáculo.
 *   Esto evita “filtraciones” con paredes delgadas o colliders pequeños.
 */
export function crearGrillaColisiones({
  anchoMundo,
  largoMundo,
  tamCelda,
  obstaculos = [],
  paddingX = 0,
  paddingY = 0,
}) {
  const cols = Math.ceil(anchoMundo / tamCelda);
  const rows = Math.ceil(largoMundo / tamCelda);

  const inflados = obstaculos.map((o) => ({
    x: o.x - paddingX,
    y: o.y - paddingY,
    ancho: o.ancho + paddingX * 2,
    alto: o.alto + paddingY * 2,
  }));

  const bloqueada = new Uint8Array(cols * rows);

  // Marca celdas bloqueadas por OVERLAP (intersección)
  for (const o of inflados) {
    // rango aproximado de celdas que toca el obstáculo
    const x0 = clamp(Math.floor(o.x / tamCelda), 0, cols - 1);
    const y0 = clamp(Math.floor(o.y / tamCelda), 0, rows - 1);

    // -1 para evitar que un borde exacto “salte” una celda extra
    const x1 = clamp(Math.floor((o.x + o.ancho - 1) / tamCelda), 0, cols - 1);
    const y1 = clamp(Math.floor((o.y + o.alto - 1) / tamCelda), 0, rows - 1);

    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        // Opcional: si quieres ultra-precisión por intersección real, podrías
        // chequear AABB vs AABB aquí. Para grilla, con el rango ya es suficiente.
        bloqueada[cy * cols + cx] = 1;
      }
    }
  }

  return {
    anchoMundo,
    largoMundo,
    tamCelda,
    cols,
    rows,
    bloqueada,
    obstaculosInflados: inflados,
  };
}

export function mundoAPosCelda(grilla, xMundo, yMundo) {
  const cx = clamp(Math.floor(xMundo / grilla.tamCelda), 0, grilla.cols - 1);
  const cy = clamp(Math.floor(yMundo / grilla.tamCelda), 0, grilla.rows - 1);
  return { x: cx, y: cy };
}

export function celdaAMundo(grilla, cx, cy) {
  return {
    x: cx * grilla.tamCelda + grilla.tamCelda / 2,
    y: cy * grilla.tamCelda + grilla.tamCelda / 2,
  };
}

function heuristica(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

class MinHeap {
  constructor() {
    this.a = [];
  }
  push(n) {
    this.a.push(n);
    this._up(this.a.length - 1);
  }
  pop() {
    if (this.a.length === 0) return null;
    const top = this.a[0];
    const last = this.a.pop();
    if (this.a.length) {
      this.a[0] = last;
      this._down(0);
    }
    return top;
  }
  get size() {
    return this.a.length;
  }
  _up(i) {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.a[p].f <= this.a[i].f) break;
      [this.a[p], this.a[i]] = [this.a[i], this.a[p]];
      i = p;
    }
  }
  _down(i) {
    const n = this.a.length;
    for (;;) {
      let m = i;
      const l = i * 2 + 1;
      const r = l + 1;
      if (l < n && this.a[l].f < this.a[m].f) m = l;
      if (r < n && this.a[r].f < this.a[m].f) m = r;
      if (m === i) break;
      [this.a[m], this.a[i]] = [this.a[i], this.a[m]];
      i = m;
    }
  }
}

function vecinos(grilla, n, diagonales) {
  const res = [];
  const x = n.x;
  const y = n.y;

  const dirs4 = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];

  for (const d of dirs4) {
    const nx = x + d.dx;
    const ny = y + d.dy;
    if (esCeldaLibre(grilla, nx, ny)) res.push({ x: nx, y: ny, costo: 1 });
  }

  if (!diagonales) return res;

  const dirsDiag = [
    { dx: 1, dy: 1 },
    { dx: 1, dy: -1 },
    { dx: -1, dy: 1 },
    { dx: -1, dy: -1 },
  ];

  for (const d of dirsDiag) {
    const nx = x + d.dx;
    const ny = y + d.dy;

    if (!esCeldaLibre(grilla, nx, ny)) continue;

    const orto1 = esCeldaLibre(grilla, x + d.dx, y);
    const orto2 = esCeldaLibre(grilla, x, y + d.dy);
    if (!orto1 || !orto2) continue;

    res.push({ x: nx, y: ny, costo: Math.SQRT2 });
  }

  return res;
}

export function encontrarRutaAEstrella(grilla, inicio, fin, { diagonales = true } = {}) {
  if (!esCeldaLibre(grilla, inicio.x, inicio.y)) return [];
  if (!esCeldaLibre(grilla, fin.x, fin.y)) return [];

  const open = new MinHeap();
  const cols = grilla.cols;

  const gScore = new Float32Array(grilla.cols * grilla.rows);
  const cameFrom = new Int32Array(grilla.cols * grilla.rows);
  const openMark = new Uint8Array(grilla.cols * grilla.rows);

  for (let i = 0; i < gScore.length; i++) {
    gScore[i] = Infinity;
    cameFrom[i] = -1;
  }

  const startI = idx(grilla, inicio.x, inicio.y);
  const endI = idx(grilla, fin.x, fin.y);

  gScore[startI] = 0;
  open.push({
    x: inicio.x,
    y: inicio.y,
    i: startI,
    f: heuristica(inicio, fin),
  });
  openMark[startI] = 1;

  while (open.size) {
    const cur = open.pop();
    if (!cur) break;

    if (cur.i === endI) {
      const ruta = [];
      let k = endI;
      while (k !== -1) {
        const cx = k % cols;
        const cy = Math.floor(k / cols);
        ruta.push({ x: cx, y: cy });
        k = cameFrom[k];
      }
      ruta.reverse();
      return ruta;
    }

    const v = vecinos(grilla, cur, diagonales);
    for (const nb of v) {
      const ni = idx(grilla, nb.x, nb.y);
      const tent = gScore[cur.i] + nb.costo;

      if (tent < gScore[ni]) {
        cameFrom[ni] = cur.i;
        gScore[ni] = tent;

        const f = tent + heuristica(nb, fin);
        if (!openMark[ni]) {
          openMark[ni] = 1;
          open.push({ x: nb.x, y: nb.y, i: ni, f });
        } else {
          open.push({ x: nb.x, y: nb.y, i: ni, f });
        }
      }
    }
  }

  return [];
}

export function listarCeldasLibresCercanas(grilla, base, radio = 10) {
  const r = Math.max(0, Math.floor(radio));
  const res = [];

  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const x = base.x + dx;
      const y = base.y + dy;
      if (!esCeldaLibre(grilla, x, y)) continue;

      const d2 = dx * dx + dy * dy;
      res.push({ x, y, d2 });
    }
  }

  res.sort((a, b) => a.d2 - b.d2);
  return res.map(({ x, y }) => ({ x, y }));
}

export function comprimirRutaPorGiros(rutaCeldas) {
  if (!rutaCeldas || rutaCeldas.length <= 2) return rutaCeldas ?? [];

  const out = [];
  out.push(rutaCeldas[0]);

  let prevDir = null;

  for (let i = 1; i < rutaCeldas.length; i++) {
    const a = rutaCeldas[i - 1];
    const b = rutaCeldas[i];

    const dir = {
      dx: Math.sign(b.x - a.x),
      dy: Math.sign(b.y - a.y),
    };

    if (!prevDir) {
      prevDir = dir;
      continue;
    }

    if (dir.dx !== prevDir.dx || dir.dy !== prevDir.dy) {
      out.push(a);
      prevDir = dir;
    }
  }

  out.push(rutaCeldas[rutaCeldas.length - 1]);

  const limpio = [];
  for (const p of out) {
    const prev = limpio[limpio.length - 1];
    if (!prev || prev.x !== p.x || prev.y !== p.y) limpio.push(p);
  }
  return limpio;
}
