import { createId } from "../planning/events.js";
import { dateToInput, pad } from "../planning/week.js";

function unfold(text) {
  return String(text || "").replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
}

function clean(value) {
  return String(value || "")
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

function getValue(line) {
  const index = line.indexOf(":");
  return index >= 0 ? line.slice(index + 1) : "";
}

function hasAllDayDate(line) {
  return /VALUE=DATE/.test(line) || /^\d{8}$/.test(getValue(line));
}

function parseDateTime(line) {
  const value = getValue(line);
  const allDay = hasAllDayDate(line);
  if (allDay) {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(4, 6));
    const day = Number(value.slice(6, 8));
    return { date: `${year}-${pad(month)}-${pad(day)}`, time: "", allDay: true };
  }

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6));
  const day = Number(value.slice(6, 8));
  const hours = Number(value.slice(9, 11));
  const minutes = Number(value.slice(11, 13));
  return { date: dateToInput(new Date(year, month - 1, day)), time: `${pad(hours)}:${pad(minutes)}`, allDay: false };
}

function parseBlock(block) {
  const lines = block.split(/\r?\n/);
  const summary = clean(getValue(lines.find((line) => line.startsWith("SUMMARY")) || ""));
  const description = clean(getValue(lines.find((line) => line.startsWith("DESCRIPTION")) || ""));
  const location = clean(getValue(lines.find((line) => line.startsWith("LOCATION")) || ""));
  const startLine = lines.find((line) => line.startsWith("DTSTART"));
  const endLine = lines.find((line) => line.startsWith("DTEND"));

  if (!startLine || !summary) return null;

  const start = parseDateTime(startLine);
  const end = endLine ? parseDateTime(endLine) : { time: "", allDay: start.allDay };
  const raw = `${summary}\n${description}\n${location}`;

  return {
    id: createId(),
    source: "calendar",
    date: start.date,
    from: start.time,
    to: end.time,
    allDay: start.allDay || end.allDay,
    title: summary,
    person: extractPerson(description) || location,
    raw
  };
}

function extractPerson(text) {
  const match = String(text || "").match(/(?:zodpovida|odpovida|ucitel|teacher)\s*[:\-]\s*([^\n]+)/i);
  return match ? match[1].trim() : "";
}

export function parseIcs(text) {
  const source = unfold(text);
  const blocks = source.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];
  return blocks.map(parseBlock).filter(Boolean);
}
