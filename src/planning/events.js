import { isDateInRange } from "./week.js";

export function createId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function minutesFromTime(time) {
  if (!time) return -1;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function formatTime(time) {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  return `${Number(hours)}.${minutes}`;
}

export function renderTimeRange(event) {
  if (event.allDay) return "celý den";
  if (event.from && event.to) return `${formatTime(event.from)}-${formatTime(event.to)}`;
  return formatTime(event.from);
}

export function normalizeEvent(event) {
  return {
    id: event.id || createId(),
    source: event.source || "manual",
    date: event.date || event.startDate || "",
    from: event.from || "",
    to: event.to || "",
    allDay: Boolean(event.allDay),
    title: event.title || "",
    person: event.person || "",
    raw: event.raw || ""
  };
}

export function sortEvents(events) {
  return [...events].sort((a, b) => {
    const date = a.date.localeCompare(b.date);
    if (date !== 0) return date;
    return minutesFromTime(a.from) - minutesFromTime(b.from);
  });
}

export function eventsForWeek(events, from, to) {
  return sortEvents(events.filter((event) => isDateInRange(event.date, from, to)));
}

export function mergeEvents(calendarEvents, manualEvents, from, to, options) {
  const filteredCalendar = calendarEvents
    .filter((event) => isDateInRange(event.date, from, to))
    .filter((event) => !(options.skipReservations && isReservation(event)))
    .filter((event) => !(options.skipSubjects && isSubjectEvent(event)));

  return sortEvents([...filteredCalendar, ...eventsForWeek(manualEvents, from, to)].map(normalizeEvent));
}

export function isReservation(event) {
  return /rezerv|reservation/i.test(`${event.title} ${event.raw}`);
}

export function isSubjectEvent(event) {
  const text = `${event.title} ${event.raw}`.toLowerCase();
  return /\b(\d\.[a-z]|[1-9]\.|matematika|cesky jazyk|anglicky jazyk|prvouka|vytvarna|hudebni|telesna)\b/.test(text);
}
