// Contenido con el que arranca el celular la primera vez.
// Después de la instalación todo se edita desde el panel /admin; este archivo ya no se usa.
export const CONTENIDO_INICIAL = {
  pin: "1907",
  duena: "Lucía Ferrán",
  fechaBloqueo: "Domingo 18 de octubre",
  horaBloqueo: "09:41",
  bateria: 23,

  chats: [
    {
      id: "marina", nombre: "Marina", color: "#b0476b", grupo: false,
      mensajes: [
        { dia: "Sábado 17/10", de: "yo", hora: "21:20", tipo: "texto", texto: "Después hablamos bien lo de la reseña." },
        { de: "el", hora: "21:21", tipo: "texto", texto: "Dale Lu. Ya te dije, fue una botella que vino mal de la bodega. Pasa." },
        { de: "yo", hora: "21:22", tipo: "texto", texto: "Puede ser." },
        { dia: "Domingo 18/10", de: "el", hora: "12:31", tipo: "texto", texto: "Lu?" },
        { de: "el", hora: "12:31", tipo: "texto", texto: "Me dijo Rosa una cosa horrible, decime que no es cierto" },
        { de: "el", hora: "12:40", tipo: "texto", texto: "Lu por favor" }
      ]
    },
    {
      id: "carla", nombre: "Carla", color: "#3f7d6e", grupo: false,
      mensajes: [
        { dia: "Viernes 16/10", de: "yo", hora: "22:10", tipo: "texto", texto: "Descubrí algo feo en el resto. Muy feo." },
        { de: "el", hora: "22:10", tipo: "texto", texto: "¿Qué pasó? ¿Estás bien?" },
        { de: "yo", hora: "22:12", tipo: "texto", texto: "Sí. No por acá. El lunes voy al abogado y después te cuento todo." },
        { de: "el", hora: "22:13", tipo: "texto", texto: "Me asustás. Cuidate, ¿sí?" },
        { dia: "Sábado 17/10", de: "el", hora: "23:40", tipo: "texto", texto: "¿Cerraste? Avisame cuando llegues a casa" },
        { dia: "Domingo 18/10", de: "el", hora: "08:30", tipo: "texto", texto: "Lu?" },
        { de: "el", hora: "10:02", tipo: "texto", texto: "Lu contestame por favor" }
      ]
    },
    {
      id: "paz", nombre: "Dr. Hernán Paz", color: "#3b5b8c", grupo: false,
      mensajes: [
        { dia: "Viernes 16/10", de: "yo", hora: "23:58", tipo: "texto", texto: "Hernán, te mandé un mail. Es urgente. Perdón la hora." },
        { dia: "Sábado 17/10", de: "el", hora: "10:59", tipo: "texto", texto: "Leído. Ya te respondí por mail." },
        { de: "el", hora: "11:02", tipo: "audio", audio: "", dur: "0:21",
          texto: "Lucía, habla el doctor Paz. Recibí las fotos que me mandaste. Es serio. El lunes a las diez lo vemos con calma en el estudio. Te pido una cosa: no confrontes a nadie antes. A nadie. Hacé de cuenta que no sabés nada. Hablamos." },
        { de: "yo", hora: "11:15", tipo: "texto", texto: "Ok. Gracias." }
      ]
    },
    {
      id: "tomas", nombre: "Tomás", color: "#8a5a2b", grupo: false,
      mensajes: [
        { dia: "Sábado 17/10", de: "el", hora: "15:40", tipo: "texto", texto: "Paso a las 4 por el resto." },
        { de: "yo", hora: "15:41", tipo: "texto", texto: "Tomás, no tengo plata para darte. No vengas." },
        { de: "el", hora: "15:41", tipo: "texto", texto: "Voy igual." },
        { de: "el", hora: "16:40", tipo: "audio", audio: "", dur: "0:18",
          texto: "Lu... soy yo. Perdoname por lo de hoy. Te dije cualquier cosa. Estoy muy apretado, ya sabés con quién. No te pido que me des, te pido que me prestes. Contestame. Por favor." }
      ]
    },
    {
      id: "gerardo", nombre: "Gerardo Lell", color: "#555d6b", grupo: false,
      mensajes: [
        { dia: "Miércoles 14/10", de: "el", hora: "10:12", tipo: "texto", texto: "Lucía, te mandé la oferta por mail. Es la última." },
        { dia: "Sábado 17/10", de: "el", hora: "22:15", tipo: "audio", audio: "", dur: "0:23",
          texto: "(De fondo: viento, gaviotas, una bocina de barco) Lucía, Gerardo Lell. Te hablo desde Montevideo, recién llego. Mirá, mi oferta sigue en pie, y te subo un diez por ciento. Pensalo el fin de semana. No vas a tener una oferta mejor. El lunes te escribo." }
      ]
    },
    {
      id: "equipo", nombre: "Casa Ferrán · Equipo", color: "#7a1e3a", grupo: true,
      mensajes: [
        { dia: "Lunes 05/10", tipo: "sistema", texto: "Julián salió del grupo" },
        { dia: "Sábado 17/10", de: "yo", hora: "18:05", tipo: "texto", texto: "Chicos, hoy después del cierre hago inventario de cava. Me quedo yo." },
        { de: "Marina", hora: "18:07", tipo: "texto", texto: "Te ayudo!" },
        { de: "Eze", hora: "18:10", tipo: "texto", texto: "Dale jefa" },
        { de: "Sofi", hora: "18:11", tipo: "texto", texto: "Ok! Hoy explota, hay 3 cumpleaños" },
        { dia: "Domingo 18/10", de: "Sofi", hora: "00:24", tipo: "texto", texto: "Llegué. Buenas noches a todos" },
        { de: "Rosa", hora: "09:35", tipo: "texto", texto: "Por favor alguien venga al restaurante" }
      ]
    }
  ],

  galeria: [
    { id: "f1", src: "", fecha: "Viernes 16/10 · 23:48", lugar: "Casa Ferrán", nombre: "etiquetas_uv_1.jpg",
      desc: "Dos etiquetas de Gran Reserva sobre la mesa de la oficina, a oscuras, con luz UV. Una tiene el sello ADT brillando; la otra no." },
    { id: "f2", src: "", fecha: "Viernes 16/10 · 23:51", lugar: "Casa Ferrán", nombre: "etiquetas_uv_2.jpg",
      desc: "Estante de la cava con las 12 botellas de Gran Reserva. Pegado al estante, un papel escrito a mano: ¿TODAS?" },
    { id: "f3", src: "", fecha: "Sábado 03/10 · 21:15", lugar: "Casa Ferrán", nombre: "IMG_3381.jpg",
      desc: "Lucía y Carla brindando en el salón. Atrás, Marina sirve vino; se ve la golondrina tatuada en su mano." },
    { id: "f4", src: "", fecha: "Martes 08/09 · 18:30", lugar: "Casa Ferrán", nombre: "IMG_3104.jpg",
      desc: "Foto del equipo en la puerta del restaurante: Lucía, Marina, Eze, Sofi y Rosa." },
    { id: "f5", src: "", fecha: "Viernes 14/08 · 17:02", lugar: "Casa Ferrán", nombre: "IMG_2950.jpg",
      desc: "Lucía en la cava, sonriendo, con una Magnum de Gran Reserva en cada mano. El lacre rojo con dorado está entero en las dos." },
    { id: "f6", src: "", fecha: "Viernes 14/08 · 17:05", lugar: "Casa Ferrán", nombre: "IMG_2951.jpg",
      desc: "La escalera de hierro de la cava vista desde arriba. 14 escalones." }
  ],

  correos: [
    { id: "factura", de: "Centinela Seguridad", email: "facturacion@centinela-seguridad.com.ar", nuevo: true, enviado: false,
      asunto: "Tu factura de octubre", fecha: "Sáb 17/10", hora: "08:00", adjuntos: [],
      cuerpo: "Hola Lucía:\n\nYa está disponible tu factura de octubre del servicio de monitoreo de alarma de Casa Ferrán.\n\nRecordá que podés ver el historial de tu alarma desde la app Centinela, con tu usuario y clave de cliente.\n\nEquipo Centinela" },
    { id: "paz", de: "Dr. Hernán Paz", email: "hpaz@estudiopaz.com.ar", nuevo: true, enviado: false,
      asunto: "RE: Urgente - vinos", fecha: "Sáb 17/10", hora: "10:58", adjuntos: [],
      cuerpo: "Lucía: recibido.\n\nConfirmamos el lunes 19 a las 10 en el estudio. Traé las etiquetas, la libreta y, si podés, los remitos de compras de los últimos 8 meses.\n\nTe mando un audio.\n\nH. Paz" },
    { id: "enviado", de: "Yo", email: "para: hpaz@estudiopaz.com.ar", nuevo: false, enviado: true,
      asunto: "Urgente - vinos", fecha: "Vie 16/10", hora: "23:59", adjuntos: ["f1", "f2"],
      cuerpo: "Hernán, perdón la hora.\n\nCreo que me están falsificando el vino más caro de la carta. Las 12 botellas de la cava no tienen el sello de seguridad de la bodega. Las originales no están.\n\nLas compras de vino las maneja una sola persona. No quiero decir nombres por mail.\n\n¿Podemos vernos el lunes?\n\nLucía" },
    { id: "bodega", de: "Altos del Tupungato", email: "autenticidad@altosdeltupungato.com.ar", nuevo: false, enviado: false,
      asunto: "RE: Consulta botellas Gran Reserva", fecha: "Vie 16/10", hora: "17:20", adjuntos: [],
      cuerpo: "Estimada Lucía:\n\nConfirmamos que las botellas Gran Reserva 2015 N° 4471 a 4482 fueron despachadas a Casa Ferrán el 14 de febrero.\n\nLas Magnum N° M-07 y M-08 también corresponden a ese envío. Su lacre lleva mica dorada, exclusiva de nuestra bodega.\n\nTodas nuestras Gran Reserva llevan un sello de seguridad visible con luz ultravioleta y corcho marcado a fuego con las letras ADT.\n\nSaludos,\nÁrea de Autenticidad" },
    { id: "gerardo", de: "Gerardo Lell", email: "glell@lellinversiones.com.ar", nuevo: false, enviado: false,
      asunto: "Oferta final", fecha: "Mié 14/10", hora: "10:05", adjuntos: [],
      cuerpo: "Lucía:\n\nTe reitero mi oferta por el fondo de comercio. Es la tercera vez que te escribo.\n\nViajo a Montevideo el sábado a la tarde; podemos cerrar a mi vuelta.\n\nG. Lell" },
    { id: "julian", de: "Julián Ocampo", email: "juli.ocampo@correo.com", nuevo: false, enviado: false,
      asunto: "Carta documento", fecha: "Mar 06/10", hora: "09:30", adjuntos: [],
      cuerpo: "Lucía:\n\nTe aviso que mi abogado te va a mandar una carta documento por el despido. Prefiero arreglarlo por las buenas, pero no me dejaste opción.\n\nJulián" }
  ],

  centinela: {
    usuario: "casaferran",
    clave: "Cava#1550",
    cliente: "Casa Ferrán",
    eventos: [
      { fecha: "18/10", hora: "09:18", tipo: "DESARMADO", usuario: "Usuario 05", lugar: "Teclado puerta trasera" },
      { fecha: "18/10", hora: "00:41", tipo: "ARMADO", usuario: "Usuario 01", lugar: "Teclado puerta trasera" },
      { fecha: "17/10", hora: "11:02", tipo: "DESARMADO", usuario: "Usuario 01", lugar: "Teclado puerta trasera" },
      { fecha: "16/10", hora: "11:04", tipo: "DESARMADO", usuario: "Usuario 01", lugar: "Teclado puerta trasera" },
      { fecha: "16/10", hora: "00:33", tipo: "ARMADO", usuario: "Usuario 03", lugar: "Teclado puerta trasera" },
      { fecha: "15/10", hora: "10:55", tipo: "DESARMADO", usuario: "Usuario 01", lugar: "Teclado puerta trasera" },
      { fecha: "15/10", hora: "00:28", tipo: "ARMADO", usuario: "Usuario 03", lugar: "Teclado puerta trasera" }
    ],
    zonas: [
      { n: "Z1", nombre: "Puerta principal", tipo: "Magnético", estado: "Activa", nota: "" },
      { n: "Z2", nombre: "Puerta trasera", tipo: "Magnético", estado: "Activa", nota: "" },
      { n: "Z3", nombre: "Salón", tipo: "Movimiento", estado: "Activa", nota: "" },
      { n: "Z4", nombre: "Cocina", tipo: "Movimiento", estado: "Activa", nota: "" },
      { n: "Z5", nombre: "Oficina", tipo: "Movimiento", estado: "Activa", nota: "" },
      { n: "Z6", nombre: "Cava", tipo: "Movimiento", estado: "Anulada", nota: "Desde 03/2026 · falsas alarmas por humedad" }
    ]
  }
};
