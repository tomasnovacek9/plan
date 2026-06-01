const KEYS = {
  app: "tydenni_plan_app_v1",
  notes: "tydenni_plan_notes_v1",
  responsible: "tydenni_plan_responsible_v1"
};

export function loadAppState() {
  return readJson(KEYS.app, null);
}

export function saveAppState(data) {
  writeJson(KEYS.app, data);
}

export function loadNotes() {
  return readJson(KEYS.notes, {});
}

export function saveNotes(notes) {
  writeJson(KEYS.notes, notes);
}

export function readResponsibleOverrides() {
  return readJson(KEYS.responsible, {});
}

export function saveResponsibleOverrides(data) {
  writeJson(KEYS.responsible, data);
}

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Local storage can be unavailable in private windows.
  }
}
