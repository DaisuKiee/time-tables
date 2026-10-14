const Schedule = require('../models/Schedule.model');

/**
 * A "subject offering" is one subject taught to one section in one term. It is
 * the unit the rest of the system reasons about: exactly one Schedule document
 * and therefore exactly one ClassSpace.
 *
 * The schedule builder works cell by cell, so a 4-hour lab is dropped as
 * several blocks. Saving those as separate Schedule documents produced one
 * ClassSpace - and one "My Classes" card - per block, which is why the same
 * subject appeared over and over. These helpers fold the blocks back into a
 * single offering carrying all of its meeting times, matching what the AI
 * generators already produce.
 */

const DAY_ORDER = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 7,
};

/** '08:00' or '08:00:00' -> 480. Returns null for unparseable input. */
const toMinutes = (time) => {
  if (!time) return null;
  const [h, m] = String(time).split(':').map(Number);
  if (Number.isNaN(h)) return null;
  return h * 60 + (m || 0);
};

/**
 * Natural key of an offering. Deliberately excludes faculty and room: the same
 * subject for the same section IS the same class regardless of who ends up
 * teaching it, so two rows differing only by teacher are a data error, not two
 * offerings.
 */
const offeringKey = (row) => [
  String(row?.subject?._id || row?.subject || ''),
  String(row?.sectionCode || '').toUpperCase(),
  String(row?.academicYear || ''),
  String(row?.semester ?? ''),
].join('|');

const slotKey = (slot) => `${slot.day}|${slot.startTime}|${slot.endTime}`;

/**
 * Union of several slot lists: exact duplicates collapse, and the result is
 * ordered by day then start time so the UI's "first meeting" is the real one.
 *
 * Adjacent blocks are also joined - two 1-hour drops at 08:00 and 09:00 become
 * a single 08:00-10:00 meeting, which is what the user drew.
 */
const mergeTimeSlots = (...lists) => {
  const seen = new Set();
  const slots = [];

  for (const list of lists) {
    for (const slot of list || []) {
      if (!slot?.day || !slot?.startTime || !slot?.endTime) continue;
      const key = slotKey(slot);
      if (seen.has(key)) continue;
      seen.add(key);
      slots.push({ day: slot.day, startTime: slot.startTime, endTime: slot.endTime });
    }
  }

  slots.sort((a, b) => {
    const dayDiff = (DAY_ORDER[a.day] || 99) - (DAY_ORDER[b.day] || 99);
    if (dayDiff !== 0) return dayDiff;
    return (toMinutes(a.startTime) ?? 0) - (toMinutes(b.startTime) ?? 0);
  });

  // Coalesce touching or overlapping blocks on the same day
  const merged = [];
  for (const slot of slots) {
    const last = merged[merged.length - 1];
    const start = toMinutes(slot.startTime);
    const lastEnd = last ? toMinutes(last.endTime) : null;

    if (last && last.day === slot.day && start !== null && lastEnd !== null && start <= lastEnd) {
      const end = toMinutes(slot.endTime);
      if (end !== null && end > lastEnd) last.endTime = slot.endTime;
      continue;
    }
    merged.push({ ...slot });
  }

  return merged;
};

const facultyId = (row) => String(row?.faculty?._id || row?.faculty || '');
const roomId = (row) => String(row?.room?._id || row?.room || '');

/**
 * Fold rows destined for the same offering into one.
 *
 * @param {object[]} rows Incoming schedule rows. Each may carry `index` and
 *   `label` for error reporting; anything else is taken from the first row of
 *   the group.
 * @returns {{groups: object[], errors: object[]}} `groups[].merged` is the row
 *   to write; `errors` lists groups whose rows disagree on teacher or room.
 */
const groupRowsByOffering = (rows = []) => {
  const byKey = new Map();

  rows.forEach((row, i) => {
    const key = offeringKey(row);
    if (!byKey.has(key)) byKey.set(key, { key, rows: [], firstIndex: i });
    byKey.get(key).rows.push(row);
  });

  const groups = [];
  const errors = [];

  for (const group of byKey.values()) {
    const [head, ...rest] = group.rows;
    const label = head.subjectCode || head.label || 'subject';

    // A single offering has one teacher and one room. Merging rows that
    // disagree would silently discard one of the choices.
    const clash = rest.find(r => facultyId(r) !== facultyId(head) || roomId(r) !== roomId(head));
    if (clash) {
      const what = facultyId(clash) !== facultyId(head) ? 'instructor' : 'room';
      errors.push({
        index: clash.index ?? group.firstIndex,
        subject: label,
        error: `${label} is placed more than once for ${head.sectionCode} with a different ${what}. `
          + `A subject has one ${what} per section - fix the blocks so they match.`,
      });
      continue;
    }

    groups.push({
      key: group.key,
      rows: group.rows,
      merged: {
        ...head,
        timeSlots: mergeTimeSlots(...group.rows.map(r => r.timeSlots)),
      },
    });
  }

  return { groups, errors };
};

/**
 * The saved Schedule for this offering, if there is one.
 *
 * @param {object} row Anything carrying subject/sectionCode/academicYear/semester
 * @returns {Promise<object|null>} a Schedule document
 */
const findExistingOffering = (row) => {
  const subject = row?.subject?._id || row?.subject;
  if (!subject) return Promise.resolve(null);

  return Schedule.findOne({
    subject,
    sectionCode: String(row.sectionCode || '').toUpperCase(),
    academicYear: row.academicYear,
    semester: row.semester,
    isActive: true,
  });
};

/**
 * Add meeting times to an existing offering.
 *
 * Faculty load is NOT touched: the offering was already counted when it was
 * first created, and adding a meeting time to a class the teacher already
 * teaches does not give them another subject.
 *
 * @returns {Promise<object>} the updated Schedule document
 */
const appendSlotsToOffering = async (schedule, timeSlots) => {
  schedule.timeSlots = mergeTimeSlots(schedule.timeSlots, timeSlots);
  await schedule.save();
  return schedule;
};

module.exports = {
  offeringKey,
  mergeTimeSlots,
  groupRowsByOffering,
  findExistingOffering,
  appendSlotsToOffering,
};
