/**
 * Display helpers for faculty teaching history.
 *
 * Mirrors the recency rules in backend/utils/teachingExperience.js so the UI
 * ranks and labels experience the same way the recommender does. Keep the two
 * in sync: recent experience outweighs older experience.
 */

const RECENCY_DECAY_PER_YEAR = 0.15;
const RECENCY_FLOOR = 0.25;
export const STALE_AFTER_YEARS = 5;

/** '2024-2025' | '2024-25' | '2024' -> 2024 */
export const parseAcademicYearStart = (academicYear) => {
  if (!academicYear) return null;
  const m = String(academicYear).match(/(\d{4})/);
  return m ? parseInt(m[1], 10) : null;
};

/** PH academic years run Aug-Jun, so June onward belongs to the AY starting this year. */
export const currentAcademicYearStart = (now = new Date()) =>
  now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;

export const formatAcademicYear = (startYear) => `${startYear}-${startYear + 1}`;

export const yearsAgoFor = (academicYear, now = new Date()) => {
  const start = parseAcademicYearStart(academicYear);
  if (start === null) return null;
  return Math.max(currentAcademicYearStart(now) - start, 0);
};

export const recencyWeight = (yearsAgo) => {
  if (yearsAgo === null || yearsAgo === undefined) return RECENCY_FLOOR;
  return Math.max(RECENCY_FLOOR, 1 - RECENCY_DECAY_PER_YEAR * yearsAgo);
};

/** "this year" / "last year" / "3 years ago" */
export const describeRecency = (yearsAgo) => {
  if (yearsAgo === null || yearsAgo === undefined) return 'unknown';
  if (yearsAgo === 0) return 'this year';
  if (yearsAgo === 1) return 'last year';
  return `${yearsAgo} years ago`;
};

/**
 * Group a faculty member's teachingHistory by subject, most experienced first.
 * Note: entries store `subjectCode`/`subjectName` directly (there is no
 * populated `subject` reference).
 */
export const summarizeAllSubjects = (faculty, now = new Date()) => {
  const groups = new Map();

  (faculty?.teachingHistory || []).forEach((h) => {
    const key = h.subjectCode || h.subjectName;
    if (!key) return;

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        subjectCode: h.subjectCode || null,
        subjectName: h.subjectName || null,
        program: h.program || null,
        occurrences: [],
      });
    }

    const yearsAgo = yearsAgoFor(h.academicYear, now);
    groups.get(key).occurrences.push({
      academicYear: h.academicYear || null,
      semester: h.semester || null,
      yearsAgo,
      rating: typeof h.rating === 'number' && h.rating > 0 ? h.rating : null,
      weight: recencyWeight(yearsAgo),
    });
  });

  return [...groups.values()]
    .map((g) => {
      const occurrences = [...g.occurrences].sort(
        (a, b) => (a.yearsAgo ?? 99) - (b.yearsAgo ?? 99)
      );
      const weightedExperience = occurrences.reduce((s, o) => s + o.weight, 0);
      const rated = occurrences.filter((o) => o.rating !== null);
      const ages = occurrences.map((o) => o.yearsAgo).filter((y) => y !== null);
      const lastTaughtYearsAgo = ages.length ? Math.min(...ages) : null;

      return {
        ...g,
        occurrences,
        timesTaught: occurrences.length,
        weightedExperience,
        lastTaughtAcademicYear: occurrences[0]?.academicYear ?? null,
        lastTaughtYearsAgo,
        avgRating: rated.length
          ? rated.reduce((s, o) => s + o.rating, 0) / rated.length
          : null,
        isStale: lastTaughtYearsAgo !== null && lastTaughtYearsAgo >= STALE_AFTER_YEARS,
      };
    })
    .sort((a, b) => b.weightedExperience - a.weightedExperience);
};

/** Total distinct subjects a teacher has handled. */
export const countDistinctSubjects = (faculty) =>
  new Set(
    (faculty?.teachingHistory || [])
      .map((h) => h.subjectCode || h.subjectName)
      .filter(Boolean)
  ).size;
