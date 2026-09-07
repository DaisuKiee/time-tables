const Room = require('../models/Room.model');

/**
 * Room label resolution.
 *
 * `Schedule.room` is declared as a String but actually stores a Room `_id`.
 * Mongoose therefore cannot `.populate()` it, so anything that renders
 * `schedule.room` directly shows a raw 24-character hex id to the user.
 *
 * These helpers resolve those ids in one batched query and expose a
 * human-readable `roomLabel` (plus `roomDetail`) alongside the raw value, so
 * the stored shape is untouched and older records that hold a plain label like
 * "Room 101" keep working.
 */

const OBJECT_ID = /^[a-f\d]{24}$/i;

const looksLikeObjectId = (value) => typeof value === 'string' && OBJECT_ID.test(value);

/**
 * Load the rooms referenced by a set of raw `room` values.
 * @param {Array<string|undefined>} rawValues
 * @returns {Promise<Map<string, object>>} keyed by id string
 */
const loadRoomsByRawValues = async (rawValues = []) => {
  const ids = [...new Set(rawValues.filter(looksLikeObjectId))];
  if (ids.length === 0) return new Map();

  const rooms = await Room.find({ _id: { $in: ids } })
    .select('roomCode roomName building capacity roomType')
    .lean();

  return new Map(rooms.map(r => [r._id.toString(), r]));
};

/** Best display string for a room document. */
const labelFor = (room) => (room ? room.roomCode || room.roomName || null : null);

/**
 * Attach `schedule.roomLabel` to plain schedule objects.
 * Call `.lean()` (or `.toObject()`) first - Mongoose documents ignore new keys.
 *
 * @param {object[]} schedules plain schedule objects
 */
const attachScheduleRoomLabels = async (schedules = []) => {
  const byId = await loadRoomsByRawValues(schedules.map(s => s?.room));

  schedules.forEach(schedule => {
    if (!schedule) return;
    const raw = schedule.room;
    const room = looksLikeObjectId(raw) ? byId.get(raw) : null;

    schedule.roomLabel = room
      ? labelFor(room)
      // Not an id, so it's already a usable label (legacy rows)
      : looksLikeObjectId(raw) ? null : raw || null;

    if (room) schedule.roomDetail = room;
  });

  return schedules;
};

/**
 * Attach `schedule.roomLabel` to objects that hold the schedule one level down,
 * e.g. ClassSpace documents with a populated `schedule`.
 *
 * @param {object[]} items plain objects with an optional `.schedule`
 */
const attachNestedScheduleRoomLabels = async (items = []) => {
  const schedules = items.map(i => i?.schedule).filter(Boolean);
  await attachScheduleRoomLabels(schedules);
  return items;
};

module.exports = {
  looksLikeObjectId,
  loadRoomsByRawValues,
  labelFor,
  attachScheduleRoomLabels,
  attachNestedScheduleRoomLabels,
};
