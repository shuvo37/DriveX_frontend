import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../utils/api";

// The navbar search and the car details page both need the car list.
// Keeping it for a short time means one request is shared instead of one per component,
// and 30 seconds is short enough that a car that was just booked disappears quickly.
const TTL_MS = 30_000;
const cache = { at: 0, data: null, inflight: null };

function loadCars(force) {
  const isFresh = cache.data && Date.now() - cache.at < TTL_MS;
  if (!force && isFresh) return Promise.resolve(cache.data);
  if (cache.inflight) return cache.inflight;

  cache.inflight = axios
    .get(`${API_BASE_URL}/api/car`)
    .then((res) => {
      cache.data = res.data;
      cache.at = Date.now();
      return res.data;
    })
    .finally(() => {
      cache.inflight = null;
    });

  return cache.inflight;
}

export default function useCars() {
  const [cars, setCars] = useState(cache.data ?? []);
  const [loading, setLoading] = useState(!cache.data);
  const [error, setError] = useState("");

  const refresh = useCallback((force = false) => {
    return loadCars(force)
      .then((data) => {
        setCars(data);
        setError("");
      })
      .catch(() => setError("Could not load cars."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { cars, loading, error, refresh };
}
