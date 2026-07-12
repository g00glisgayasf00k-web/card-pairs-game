/** Hardware back (Android) — cancelable event so screens can close overlays first. */

export const HARDWARE_BACK_EVENT = "royal-hardware-back";

/** Returns true if a listener called preventDefault() (handled). */
export function dispatchHardwareBack(): boolean {
  const ev = new Event(HARDWARE_BACK_EVENT, { cancelable: true });
  window.dispatchEvent(ev);
  return ev.defaultPrevented;
}

export function onHardwareBack(handler: () => boolean): () => void {
  const listener = (ev: Event) => {
    if (handler()) {
      ev.preventDefault();
    }
  };
  window.addEventListener(HARDWARE_BACK_EVENT, listener);
  return () => window.removeEventListener(HARDWARE_BACK_EVENT, listener);
}
