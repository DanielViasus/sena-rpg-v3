import { Link } from "react-router-dom";

export default function NoEncontrado() {
  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ marginTop: 0 }}>404</h1>
      <p>Ruta no encontrada.</p>
      <Link to="/">Volver al inicio</Link>
    </div>
  );
}

