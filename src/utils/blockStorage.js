const BLOCKED_PREFIX = "fp_blockedUntil_";

function keyFor(email) {
  return BLOCKED_PREFIX + email.trim().toLowerCase();
}

export function getBlockedUntil(email) {
  const saved = localStorage.getItem(keyFor(email));
  if (!saved) return null;

  const timestamp = Number(saved);
  if (Date.now() >= timestamp) {
    localStorage.removeItem(keyFor(email));
    return null;
  }
  return timestamp;
}


export function setBlockedUntil(email, timestamp) {
  localStorage.setItem(keyFor(email), String(timestamp));
}

export function clearBlockedUntil(email) {
  localStorage.removeItem(keyFor(email));
}


export function isBlocked(blockedUntil, now = Date.now()) {
  return blockedUntil !== null && now < blockedUntil;
}


export function formatBlockCountdown(blockedUntil, now = Date.now()) {
  const secondsLeft = blockedUntil !== null ? Math.max(0, Math.floor((blockedUntil - now) / 1000)) : 0;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}