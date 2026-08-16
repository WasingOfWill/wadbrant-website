#!/usr/bin/env node
/**
 * When the next article goes out.
 *
 *   node scripts/next-slot.mjs          # prints a date, YYYY-MM-DD
 *   node scripts/next-slot.mjs --why    # and says how it got there
 *
 * The rule: today, unless today is taken, in which case keep stepping two days
 * past the last thing already on the calendar. Publishing dates are the kind
 * of arithmetic that is easy to get wrong by hand and impossible to notice
 * afterwards, so nothing about this is left to a person counting on a diary.
 *
 * Dates are read and written in the site's timezone, America/New_York, which
 * is the one the posts render in. Working in local time would put a post out a
 * day early or late depending on where the machine is.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ZONE = 'America/New_York';
const POSTS = path.join(process.cwd(), 'content', 'posts');
const GAP_DAYS = 2;

const iso = (date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

/** Every date already spoken for, taken from the filenames. */
function taken() {
  if (!fs.existsSync(POSTS)) return new Set();
  return new Set(
    fs
      .readdirSync(POSTS)
      .map((name) => name.match(/^(\d{4}-\d{2}-\d{2})/)?.[1])
      .filter(Boolean)
  );
}

function addDays(day, days) {
  const at = new Date(`${day}T12:00:00Z`);
  at.setUTCDate(at.getUTCDate() + days);
  return at.toISOString().slice(0, 10);
}

export function nextSlot(now = new Date()) {
  const booked = taken();
  const today = iso(now);
  if (!booked.has(today)) return { date: today, reason: 'nothing is out today' };

  const later = [...booked].filter((day) => day >= today).sort();
  const last = later[later.length - 1];
  let slot = addDays(last, GAP_DAYS);
  while (booked.has(slot)) slot = addDays(slot, GAP_DAYS);
  return { date: slot, reason: `${last} was the last one booked, so two days on` };
}

/* pathToFileURL, not string building: a Windows path becomes file:///C:/... with
   three slashes, and a hand-rolled comparison silently never matches. */
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const slot = nextSlot();
  console.log(process.argv.includes('--why') ? `${slot.date}  (${slot.reason})` : slot.date);
}
