import { Outlet, Link } from "react-router-dom";

/**
 * Contenedor base para cualquier universo.
 * - titulo: nombre del universo
 * - enlaces: [{ etiqueta, ruta }]
 *   ruta puede ser absoluta ("/") o relativa ("piso-2")
 */
export default function UniversoBase({ titulo, enlaces = [] }) {
  return (
    <div style={{ padding: 16 }}>
      <header style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>{titulo}</h1>

        <nav style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {enlaces.map((e) => (
            <Link key={`${e.etiqueta}-${e.ruta}`} to={e.ruta}>
              {e.etiqueta}
            </Link>
          ))}
        </nav>
      </header>

      <hr />

      <section>
        <Outlet />
      </section>
    </div>
  );
}
