// Devuelve el contenido del celular solo a quien tiene un código válido.
import { json, sinKV, tokenValido, leerContenido } from "../../lib/comun.js";

export async function onRequestGet({ request, env }) {
  const falta = sinKV(env); if (falta) return falta;
  const t = new URL(request.url).searchParams.get("t");
  if (!(await tokenValido(env, t))) return json({ error: "Código no válido." }, 401);
  return json(await leerContenido(env));
}
