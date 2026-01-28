
import AppRutas from "./rutas/AppRutas.jsx";
import AtajosTecladoJuego from "./juego/sistema/AtajosTecladoJuego.jsx";
import AtajosInteraccion from "./juego/sistema/AtajosInteraccion.jsx";
import PlantillaOverlay from "./ui/PlantillaOverlay.jsx";

export default function App() {
  return (
    <>
      <AtajosTecladoJuego />
      <AtajosInteraccion />
      <AppRutas />
      <PlantillaOverlay />
    </>
  );
}



/*
import AppRutas from "./rutas/AppRutas.jsx";
import AtajosTecladoJuego from "./juego/sistema/AtajosTecladoJuego.jsx";
import AtajosInteraccion from "./juego/sistema/AtajosInteraccion.jsx";
import PlantillaOverlay from "./ui/PlantillaOverlay.jsx";

export default function App() {
  return (
    <>
      <AtajosTecladoJuego />
      <AtajosInteraccion />
      <AppRutas />
      <PlantillaOverlay />
    </>
  );
}


*/
