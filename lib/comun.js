// Funciones compartidas por el servidor (Cloudflare Pages Functions).
import { CONTENIDO_INICIAL } from "./contenido-inicial.js";

export const SAL = "caso001:";
const ALFABETO = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function normalizar(t) {
  return String(t || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export async function sha256(t) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export function sinKV(env) {
  return !env.KV ? json({ error: "Falta conectar el almacenamiento KV con el nombre KV. Mirá el paso 3 de la guía." }, 500) : null;
}

export function azar(n, alfabeto = ALFABETO) {
  const r = new Uint32Array(n);
  crypto.getRandomValues(r);
  return [...r].map((x) => alfabeto[x % alfabeto.length]).join("");
}

export function codigoNuevo() {
  return "LC-" + azar(4) + "-" + azar(4);
}

export function formatearCodigo(t) {
  const n = normalizar(t);
  if (n.length === 10 && n.startsWith("LC")) return "LC-" + n.slice(2, 6) + "-" + n.slice(6);
  return String(t).trim().toUpperCase();
}

export async function registroCodigo(codigo, nota = "") {
  const c = formatearCodigo(codigo);
  return { codigo: c, hash: await sha256(SAL + normalizar(c)), nota, activo: true, creado: new Date().toISOString(), primerUso: null };
}

// ---------- contenido ----------
export async function leerContenido(env) {
  const c = await env.KV.get("contenido", "json");
  return c || JSON.parse(JSON.stringify(CONTENIDO_INICIAL));
}
export function contenidoOriginal() {
  return JSON.parse(JSON.stringify(CONTENIDO_INICIAL));
}

// ---------- códigos ----------
export async function leerCodigos(env) {
  let c = await env.KV.get("codigos", "json");
  if (!c) {
    c = [await registroCodigo("LC-DEMO-2026", "Código de prueba. Desactivalo antes de vender.")];
    await env.KV.put("codigos", JSON.stringify(c));
  }
  return c;
}
export async function guardarCodigos(env, lista) {
  await env.KV.put("codigos", JSON.stringify(lista));
}

export async function tokenValido(env, token) {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return false;
  const lista = await leerCodigos(env);
  const c = lista.find((x) => x.hash === token);
  return !!(c && c.activo);
}

// ---------- admin ----------
export async function esAdmin(request, env) {
  const real = env.ADMIN_PASSWORD;
  if (!real) return false;
  const dada = request.headers.get("x-admin-clave") || "";
  // compara hashes para no filtrar información por el tiempo de respuesta
  const [a, b] = await Promise.all([sha256("adm:" + dada), sha256("adm:" + real)]);
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}

export async function exigirAdmin(request, env) {
  const falta = sinKV(env);
  if (falta) return falta;
  if (!env.ADMIN_PASSWORD) return json({ error: "Falta configurar la variable ADMIN_PASSWORD en Cloudflare. Mirá el paso 4 de la guía." }, 500);
  if (!(await esAdmin(request, env))) return json({ error: "Contraseña incorrecta." }, 401);
  return null;
}
