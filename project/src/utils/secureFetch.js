import { getCsrfToken } from "./csrf";

export const secureFetch = async (url, options = {}) => {
  const csrf = await getCsrfToken();

  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...options.headers,
      "Content-Type": "application/json",
      "X-CSRF-Token": csrf,
    },
  });
};
