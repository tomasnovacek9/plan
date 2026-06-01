import { parseIcs } from "./calendar/icsParser.js";
import { createId, mergeEvents, normalizeEvent } from "./planning/events.js";
import { moveWeek, weekRangeFrom } from "./planning/week.js";
import { renderPreview } from "./rendering/preview.js";
import { exportPdf } from "./rendering/pdf.js";
import {
  loadAppState,
  loadNotes,
  readResponsibleOverrides,
  saveAppState,
  saveNotes,
  saveResponsibleOverrides
} from "./storage/localStorage.js";

const state = {
  weekFrom: "",
  weekTo: "",
  calendarEvents: [],
  manualEvents: [],
  options: {
    hideWeekend: false,
    hideCreatedDate: false,
    skipReservations: true,
    skipSubjects: true
  }
};

let notes = loadNotes();
let responsibleOverrides = readResponsibleOverrides();

const el = {
  weekFrom: document.getElementById("weekFrom"),
  weekTo: document.getElementById("weekTo"),
  eventDate: document.getElementById("eventDate"),
  eventType: document.getElementById("eventType"),
  eventFrom: document.getElementById("eventFrom"),
  eventTo: document.getElementById("eventTo"),
  eventTitle: document.getElementById("eventTitle"),
  eventPerson: document.getElementById("eventPerson"),
  manualId: document.getElementById("manualId"),
  weekNote: document.getElementById("weekNote"),
  noteStatus: document.getElementById("noteStatus"),
  manualList: document.getElementById("manualList"),
  previewPage: document.getElementById("previewPage"),
  calendarStatus: document.getElementById("calendarStatus"),
  hideWeekend: document.getElementById("hideWeekend"),
  hideCreatedDate: document.getElementById("hideCreatedDate"),
  skipReservations: document.getElementById("skipReservations"),
  skipSubjects: document.getElementById("skipSubjects"),
  timeFields: document.getElementById("timeFields")
};

init();

function init() {
  const saved = loadAppState();
  const range = weekRangeFrom(new Date());

  Object.assign(state, saved || {}, {
    weekFrom: saved?.weekFrom || range.from,
    weekTo: saved?.weekTo || range.to,
    calendarEvents: saved?.calendarEvents || [],
    manualEvents: saved?.manualEvents || [],
    options: { ...state.options, ...(saved?.options || {}) }
  });

  syncControlsFromState();
  attachEvents();
  render();
  loadCalendarFromUrl(false);
}

function attachEvents() {
  document.getElementById("prevWeekButton").addEventListener("click", () => shiftWeek(-7));
  document.getElementById("nextWeekButton").addEventListener("click", () => shiftWeek(7));
  document.getElementById("currentWeekButton").addEventListener("click", () => setWeek(weekRangeFrom(new Date())));
  document.getElementById("importCalendarButton").addEventListener("click", () => loadCalendarFromUrl(true));
  document.getElementById("addEventButton").addEventListener("click", saveManualEvent);
  document.getElementById("clearFormButton").addEventListener("click", clearManualForm);
  document.getElementById("clearManualButton").addEventListener("click", clearManualEvents);
  document.getElementById("saveButton").addEventListener("click", () => persist(true));
  document.getElementById("loadButton").addEventListener("click", restoreSavedState);
  document.getElementById("resetButton").addEventListener("click", resetApp);
  document.getElementById("printButton").addEventListener("click", () => window.print());
  document.getElementById("pdfButton").addEventListener("click", (event) => exportPdf(el.previewPage, event.currentTarget));
  document.getElementById("icsFileInput").addEventListener("change", importIcsFile);

  [el.weekFrom, el.weekTo].forEach((input) => input.addEventListener("change", () => {
    state.weekFrom = el.weekFrom.value;
    state.weekTo = el.weekTo.value;
    if (!el.eventDate.value) el.eventDate.value = state.weekFrom;
    loadWeekNote();
    render();
  }));

  [el.hideWeekend, el.hideCreatedDate, el.skipReservations, el.skipSubjects].forEach((input) => {
    input.addEventListener("change", () => {
      state.options[input.id] = input.checked;
      render();
      persist(false);
    });
  });

  el.eventType.addEventListener("change", () => {
    el.timeFields.classList.toggle("hidden", el.eventType.value === "allDay");
  });

  el.weekNote.addEventListener("input", () => {
    notes[state.weekFrom] = el.weekNote.value;
    saveNotes(notes);
    el.noteStatus.textContent = "Uloženo";
    setTimeout(() => { el.noteStatus.textContent = "Automaticky se ukládá"; }, 900);
    render();
  });

  el.previewPage.addEventListener("blur", (event) => {
    const cell = event.target.closest("[data-responsible-key]");
    if (!cell) return;
    responsibleOverrides[cell.dataset.responsibleKey] = cell.textContent.trim();
    saveResponsibleOverrides(responsibleOverrides);
  }, true);
}

function syncControlsFromState() {
  el.weekFrom.value = state.weekFrom;
  el.weekTo.value = state.weekTo;
  el.eventDate.value = state.weekFrom;
  el.hideWeekend.checked = state.options.hideWeekend;
  el.hideCreatedDate.checked = state.options.hideCreatedDate;
  el.skipReservations.checked = state.options.skipReservations;
  el.skipSubjects.checked = state.options.skipSubjects;
  loadWeekNote();
}

function setWeek(range) {
  state.weekFrom = range.from;
  state.weekTo = range.to;
  syncControlsFromState();
  render();
  persist(false);
}

function shiftWeek(days) {
  setWeek(moveWeek(state.weekFrom, days));
}

function saveManualEvent() {
  if (!el.eventTitle.value.trim()) {
    el.eventTitle.focus();
    return;
  }

  const event = normalizeEvent({
    id: el.manualId.value || createId(),
    source: "manual",
    date: el.eventDate.value || state.weekFrom,
    from: el.eventType.value === "allDay" ? "" : el.eventFrom.value,
    to: el.eventType.value === "allDay" ? "" : el.eventTo.value,
    allDay: el.eventType.value === "allDay",
    title: el.eventTitle.value.trim(),
    person: el.eventPerson.value.trim()
  });

  const index = state.manualEvents.findIndex((item) => item.id === event.id);
  if (index >= 0) state.manualEvents[index] = event;
  else state.manualEvents.push(event);

  clearManualForm();
  render();
  persist(false);
}

function clearManualForm() {
  el.manualId.value = "";
  el.eventDate.value = state.weekFrom;
  el.eventType.value = "timed";
  el.eventFrom.value = "08:00";
  el.eventTo.value = "08:45";
  el.eventTitle.value = "";
  el.eventPerson.value = "";
  el.timeFields.classList.remove("hidden");
  document.getElementById("addEventButton").textContent = "Přidat do plánu";
}

function editManualEvent(id) {
  const event = state.manualEvents.find((item) => item.id === id);
  if (!event) return;
  el.manualId.value = event.id;
  el.eventDate.value = event.date;
  el.eventType.value = event.allDay ? "allDay" : "timed";
  el.eventFrom.value = event.from || "08:00";
  el.eventTo.value = event.to || "08:45";
  el.eventTitle.value = event.title;
  el.eventPerson.value = event.person;
  el.timeFields.classList.toggle("hidden", event.allDay);
  document.getElementById("addEventButton").textContent = "Uložit změnu";
}

function deleteManualEvent(id) {
  state.manualEvents = state.manualEvents.filter((event) => event.id !== id);
  render();
  persist(false);
}

function clearManualEvents() {
  if (!state.manualEvents.length || !confirm("Smazat všechny ruční záznamy?")) return;
  state.manualEvents = [];
  clearManualForm();
  render();
  persist(false);
}

function renderManualList(events) {
  const manualInWeek = events.filter((event) => event.source === "manual");
  if (!manualInWeek.length) {
    el.manualList.innerHTML = `<p class="emptyText">V tomto týdnu nejsou ruční záznamy.</p>`;
    return;
  }

  el.manualList.innerHTML = manualInWeek.map((event) => `
    <div class="manualItem">
      <div>
        <strong>${event.date}</strong>
        <span>${event.allDay ? "celý den" : `${event.from}-${event.to}`}</span>
        <p>${event.title}</p>
      </div>
      <div class="itemActions">
        <button type="button" data-edit="${event.id}">Upravit</button>
        <button type="button" data-delete="${event.id}" class="dangerButton">Smazat</button>
      </div>
    </div>
  `).join("");

  el.manualList.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => editManualEvent(button.dataset.edit));
  });
  el.manualList.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => deleteManualEvent(button.dataset.delete));
  });
}

async function loadCalendarFromUrl(showErrors) {
  setStatus("Načítám", "loading");
  try {
    const response = await fetch(`/calendar.ics?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    if (!text.includes("BEGIN:VCALENDAR")) throw new Error("Odpoved neni ICS kalendar.");
    state.calendarEvents = parseIcs(text);
    setStatus(`${state.calendarEvents.length} akcí`, "ok");
    render();
    persist(false);
  } catch (error) {
    setStatus("Bez živého kalendáře", "warning");
    if (showErrors) alert(`Kalendář se nepodařilo načíst: ${error.message}`);
  }
}

async function importIcsFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  state.calendarEvents = parseIcs(text);
  setStatus(`${state.calendarEvents.length} akcí`, "ok");
  render();
  persist(false);
}

function render() {
  const events = mergeEvents(state.calendarEvents, state.manualEvents, state.weekFrom, state.weekTo, state.options);
  renderPreview(el.previewPage, state, events, notes[state.weekFrom] || "", responsibleOverrides);
  renderManualList(events);
}

function loadWeekNote() {
  el.weekNote.value = notes[state.weekFrom] || "";
}

function persist(showAlert) {
  saveAppState(state);
  if (showAlert) alert("Uloženo v tomto prohlížeči.");
}

function restoreSavedState() {
  const saved = loadAppState();
  if (!saved) {
    alert("Zatím není nic uložené.");
    return;
  }
  Object.assign(state, saved);
  syncControlsFromState();
  render();
}

function resetApp() {
  if (!confirm("Opravdu vyčistit plán v tomto prohlížeči?")) return;
  state.calendarEvents = [];
  state.manualEvents = [];
  responsibleOverrides = {};
  saveResponsibleOverrides(responsibleOverrides);
  setWeek(weekRangeFrom(new Date()));
}

function setStatus(text, type) {
  el.calendarStatus.textContent = text;
  el.calendarStatus.dataset.type = type;
}
