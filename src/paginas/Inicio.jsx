import { Link } from "react-router-dom";

export default function Inicio() {
  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ marginTop: 0 }}>SenaRPGV1</h1>
      <p>Selecciona un universo para entrar.</p>

      <ul>
        <li>
          <Link to="/sena">Entrar al Universo SENA</Link>
        </li>
      </ul>
    </div>
  );
}
