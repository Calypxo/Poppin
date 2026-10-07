const key = "poppin.session";
export const session = {
  get: () => localStorage.getItem(key),
  set: (token: string) => localStorage.setItem(key, token),
  clear: () => localStorage.removeItem(key),
};
