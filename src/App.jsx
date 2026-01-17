import AppRutas from "./rutas/AppRutas.jsx";
import AtajosTecladoJuego from "./juego/sistema/AtajosTecladoJuego.jsx";
import AtajosInteraccion from "./juego/sistema/AtajosInteraccion.jsx";

export default function App() {
  return (
    <>
      <AtajosTecladoJuego />
      <AtajosInteraccion />
      <AppRutas />
    </>
  );
}
