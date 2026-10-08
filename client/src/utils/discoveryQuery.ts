// Keep readable calendar dates in the URL and date inputs; send the API the
// full Manila day, because its date filters compare timestamps.
export function discoveryApiQuery(query: string) {
  const params = new URLSearchParams(query);
  for (const [key, time] of [
    ["from", "T00:00:00+08:00"],
    ["to", "T23:59:59.999+08:00"],
  ]) {
    const value = params.get(key);
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      params.set(key, value + time);
    }
  }
  return params.toString();
}
