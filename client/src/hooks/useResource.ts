import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import api from "../api/client";
export function errorMessage(error: unknown) {
  return axios.isAxiosError(error)
    ? error.response?.data?.message ||
        "Unable to complete this request. Please try again."
    : "Unable to complete this request. Please try again.";
}
export default function useResource<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        setLoading(true);
        setData(null);
        setError("");
        if (path)
          setData((await api.get<T>(path, { signal: controller.signal })).data);
      } catch (err) {
        if (!controller.signal.aborted) setError(errorMessage(err));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [path, version]);
  return { data, error, loading, reload };
}
