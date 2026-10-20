// El jugador ingresa el código de su caja. Devuelve un token para pedir el contenido.
import { json, sinKV, normalizar, sha256, SAL, leerCodigos, guardarCodigos } from "../../lib/comun.js";

export async function onRequestPost({ request, env }) {
  const falta = sinKV(env); if (falta) return falta;
  let body = {};
  try { body = await request.json(); } catch (e) {}
  const n = normalizar(body.codigo);
  if (n.length < 6) return json({ error: "El código es más largo. Revisalo en la hoja de instrucciones." }, 400);
  const hash = await sha256(SAL + n);
  const lista = await leerCodigos(env);
  const c = lista.find((x) => x.hash === hash);
  if (!c) return json({ error: "Ese código no corresponde a ningún expediente. Fijate que esté bien escrito." }, 404);
  if (!c.activo) return json({ error: "Este expediente fue dado de baja. Escribinos si creés que es un error." }, 403);
  if (!c.primerUso) { c.primerUso = new Date().toISOString(); await guardarCodigos(env, lista); }
  return json({ token: hash });
}
