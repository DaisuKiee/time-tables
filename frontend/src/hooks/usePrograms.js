import { useState, useEffect, useMemo } from 'react';
import { programAPI } from '../services/api';

/**
 * Module-level cache so every component that mounts doesn't re-request the
 * program list. Programs change very rarely, so a single fetch per page load
 * is plenty.
 */
let cache = null;
let inFlight = null;

const fetchPrograms = () => {
  if (cache) return Promise.resolve(cache);
  if (inFlight) return inFlight;

  inFlight = programAPI
    .getAll({ isActive: true })
    .then(res => {
      cache = res.data.data || [];
      inFlight = null;
      return cache;
    })
    .catch(err => {
      inFlight = null;
      throw err;
    });

  return inFlight;
};

/** Drop the cache, e.g. after an admin creates or edits a program. */
export const invalidateProgramsCache = () => {
  cache = null;
  inFlight = null;
};

/**
 * Load the active programs from the database.
 *
 * @returns {{
 *   programs: Array<{_id: string, code: string, name: string}>,
 *   programCodes: string[],
 *   loading: boolean,
 *   error: Error|null
 * }}
 */
export const usePrograms = () => {
  const [programs, setPrograms] = useState(cache || []);
  const [loading, setLoading] = useState(!cache);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    if (cache) {
      setPrograms(cache);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    fetchPrograms()
      .then(list => {
        if (!active) return;
        setPrograms(list);
        setError(null);
      })
      .catch(err => {
        if (!active) return;
        console.error('Failed to load programs:', err);
        setError(err);
        setPrograms([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Memoized so callers can safely put `programCodes` in a dependency array.
  const programCodes = useMemo(() => programs.map(p => p.code), [programs]);

  return {
    programs,
    programCodes,
    loading,
    error,
  };
};

export default usePrograms;
