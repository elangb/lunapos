/* Utilitas mode offline LunaPOS
 * - Deteksi online/offline (navigator.onLine + event listener)
 * - Antrian transaksi offline di localStorage (key: lunapos-queue)
 * - Sinkronisasi otomatis saat koneksi kembali
 */
const QUEUE_KEY = 'lunapos-queue';
const listeners = new Set();

export function isOnline() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify(status) {
  listeners.forEach((fn) => {
    try { fn(status); } catch { /* noop */ }
  });
}

/* ---- listener global online/offline ---- */
let bound = false;
function bind() {
  if (bound || typeof window === 'undefined') return;
  bound = true;
  window.addEventListener('online', () => notify('online'));
  window.addEventListener('offline', () => notify('offline'));
}
bind();

/* ---- antrian ---- */
export function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function enqueue(entry) {
  const q = getQueue();
  q.push({ ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, createdAt: new Date().toISOString() });
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  } catch { /* quota */ }
  notify('queued');
  return q.length;
}

export function removeFromQueue(id) {
  const q = getQueue().filter((x) => x.id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  notify('synced');
  return q.length;
}

export function queueSize() {
  return getQueue().length;
}

/* ---- sinkronisasi ---- */
let syncing = false;

/**
 * Flush antrian offline: kirim setiap entry secara berurutan.
 * @param {(entry:object) => Promise<any>} send  fungsi pengirim (mis. salesApi.create)
 * @param {(msg:string, type?:string) => void} [notifyFn]  callback notifikasi (toast)
 */
export async function flushQueue(send, notifyFn = () => {}) {
  if (syncing) return { synced: 0, failed: 0 };
  if (!isOnline()) return { synced: 0, failed: 0 };
  const q = getQueue();
  if (!q.length) return { synced: 0, failed: 0 };
  syncing = true;
  let synced = 0;
  let failed = 0;
  for (const entry of q) {
    try {
      await send(entry);
      removeFromQueue(entry.id);
      synced++;
    } catch (e) {
      failed++;
      // stop jika offline kembali di tengah flush
      if (!isOnline()) break;
    }
  }
  syncing = false;
  if (synced > 0) notifyFn(`${synced} transaksi offline berhasil disinkronkan`, 'success');
  if (failed > 0) notifyFn(`${failed} transaksi gagal disinkronkan — akan dicoba lagi`, 'warning');
  return { synced, failed };
}
