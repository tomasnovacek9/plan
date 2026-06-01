export const DAY_NAMES = ["Nedele", "Pondeli", "Utery", "Streda", "Ctvrtek", "Patek", "Sobota"];

export function pad(value) {
  return String(value).padStart(2, "0");
}

export function dateToInput(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDate(value) {
  const date = typeof value === "string" ? parseDate(value) : value;
  if (!date) return "";
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
}

export function formatShortDate(value) {
  const date = typeof value === "string" ? parseDate(value) : value;
  if (!date) return "";
  return `${date.getDate()}.${date.getMonth() + 1}.`;
}

export function setToMonday(date) {
  const copy = new Date(date);
  const day = copy.getDay() || 7;
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - day + 1);
  return copy;
}

export function weekRangeFrom(date) {
  const monday = setToMonday(date);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: dateToInput(monday), to: dateToInput(sunday) };
}

export function weekDates(fromValue, includeWeekend = true) {
  const from = parseDate(fromValue) || setToMonday(new Date());
  const days = includeWeekend ? 7 : 5;
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(from);
    date.setDate(from.getDate() + index);
    return date;
  });
}

export function moveWeek(fromValue, days) {
  const base = parseDate(fromValue) || new Date();
  base.setDate(base.getDate() + days);
  return weekRangeFrom(base);
}

export function isDateInRange(dateValue, fromValue, toValue) {
  return dateValue >= fromValue && dateValue <= toValue;
}
