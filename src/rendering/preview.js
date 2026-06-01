import { DAY_NAMES, formatDate, formatShortDate, weekDates } from "../planning/week.js";
import { renderTimeRange } from "../planning/events.js";

export function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[char]);
}

export function renderPreview(target, state, events, note, responsibleOverrides) {
  const dates = weekDates(state.weekFrom, !state.options.hideWeekend);
  const rows = [];

  dates.forEach((date) => {
    const dateKey = toKey(date);
    const dayEvents = events.filter((event) => event.date === dateKey);

    if (!dayEvents.length) {
      rows.push(emptyDayRow(date, dateKey));
      return;
    }

    dayEvents.forEach((event, index) => {
      const key = rowKey(event);
      const person = Object.prototype.hasOwnProperty.call(responsibleOverrides, key)
        ? responsibleOverrides[key]
        : event.person;

      rows.push(`
        <tr class="${index === 0 ? "dayBreak" : ""}">
          ${index === 0 ? dayCell(date, dateKey, dayEvents.length) : ""}
          <td class="timeCell">${escapeHtml(renderTimeRange(event))}</td>
          <td class="eventCell">${escapeHtml(event.title).replace(/\n/g, "<br>")}</td>
          <td class="personCell" contenteditable="true" spellcheck="false" data-responsible-key="${escapeHtml(key)}">${escapeHtml(person).replace(/\n/g, "<br>")}</td>
        </tr>
      `);
    });
  });

  target.innerHTML = `
    <header class="docHeader headerV93">
      <div class="docHeaderTextV93">
        <p class="docSchool">Základní škola Brno, Jana Babáka 1, příspěvková organizace</p>
        <h2>TÝDENNÍ PLÁN</h2>
        <p class="docDates">od ${formatDate(state.weekFrom)} do ${formatDate(state.weekTo)}</p>
      </div>
      <div class="docLogoMark" aria-hidden="true">ZŠ</div>
    </header>

    ${note ? `<section class="weekNote">${escapeHtml(note).replace(/\n/g, "<br>")}</section>` : ""}

    <table class="planTable">
      <thead>
        <tr>
          <th>Datum</th>
          <th>Hodina</th>
          <th>Akce</th>
          <th>Zodpovídá</th>
        </tr>
      </thead>
      <tbody>${rows.join("")}</tbody>
    </table>

    <footer class="docFooter">
      <div class="signature"><span class="signatureName">Mgr. MgA. Bc. Michal Jančík</span><span class="signatureRole">, ředitel školy</span></div>
      <div class="createdDate ${state.options.hideCreatedDate ? "hidden" : ""}">Vytvořeno: ${formatDate(new Date())}</div>
      <div class="schoolFooter">
        <div>© 2026 Základní škola Brno, Jana Babáka 1, příspěvková organizace</div>
        <small>Design &amp; development: Tomáš Nováček</small>
      </div>
    </footer>
  `;
}

export function rowKey(event) {
  return [event.date, event.from, event.to, event.title].join("|");
}

function toKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function dayCell(date, dateKey, count) {
  return `
    <td class="dayCell" rowspan="${count}">
      <strong>${DAY_NAMES[date.getDay()]}</strong>
      <span>${formatShortDate(dateKey)}</span>
    </td>
  `;
}

function emptyDayRow(date, dateKey) {
  return `
    <tr class="dayBreak emptyDay">
      ${dayCell(date, dateKey, 1)}
      <td class="timeCell"></td>
      <td class="eventCell"></td>
      <td class="personCell"></td>
    </tr>
  `;
}
