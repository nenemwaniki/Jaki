const KEY = 'jaki_session_id';

export function getSessionId(): string {
  let id = localStorage.getItem(KEY);
  if (!id) {
    // Generate a new 4-digit code on first run
    id = String(Math.floor(1000 + Math.random() * 9000));
    localStorage.setItem(KEY, id);
  }
  return id;
}

export function setSessionId(id: string) {
  localStorage.setItem(KEY, id);
}

export function clearSessionId() {
  localStorage.removeItem(KEY);
}
