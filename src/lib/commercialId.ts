const KEY = "agricapital-commercial-id";
const CHANNEL = "agricapital-commercial-id-change";

export function getCommercialId(): string {
  try {
    return localStorage.getItem(KEY) || "";
  } catch {
    return "";
  }
}

export function setCommercialId(value: string) {
  try {
    if (value.trim()) localStorage.setItem(KEY, value.trim());
    else localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent(CHANNEL));
  } catch {
    /* noop */
  }
}

export function onCommercialIdChange(cb: () => void) {
  const handler = () => cb();
  window.addEventListener(CHANNEL, handler);
  return () => window.removeEventListener(CHANNEL, handler);
}
