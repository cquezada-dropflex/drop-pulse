// Mensajes de Supabase Auth en español neutro: qué pasó y qué hacer.
const KNOWN: [RegExp, string][] = [
  [/invalid login credentials/i, "El correo o la contraseña no coinciden. Revísalos e intenta de nuevo."],
  [/email not confirmed/i, "Aún no confirmas tu correo. Abre el enlace que te enviamos y vuelve a intentar."],
  [/user already registered/i, "Ya existe una cuenta con ese correo. Inicia sesión o recupera tu contraseña."],
  [/password should be at least (\d+)/i, "La contraseña debe tener al menos $1 caracteres."],
  [/new password should be different/i, "La nueva contraseña debe ser distinta de la anterior."],
  [/rate limit|too many requests|security purposes/i, "Hiciste varios intentos seguidos. Espera un minuto e intenta de nuevo."],
  [/unable to validate email|invalid email/i, "Ese correo no parece válido. Revisa que esté bien escrito."],
  [/auth session missing/i, "Tu enlace venció. Pide uno nuevo desde “¿Olvidaste tu contraseña?”."],
  [/token has expired|otp.*expired|invalid.*token|no token hash/i, "El enlace venció o ya se usó. Pide uno nuevo e intenta otra vez."],
  [/failed to fetch|network/i, "No pudimos conectarnos. Revisa tu conexión e intenta de nuevo."],
];

export function authErrorMessage(error: unknown, fallback: string): string {
  const raw = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  for (const [pattern, message] of KNOWN) {
    const m = raw.match(pattern);
    if (m) return message.replace("$1", m[1] ?? "");
  }
  return fallback;
}
