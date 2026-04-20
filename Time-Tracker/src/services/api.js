const BASE_URL = "https://time-tracker-api-c9bvg4ayekdkcef0.eastus-01.azurewebsites.net";

function buildQueryString(params = {}) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    search.set(key, String(value));
  });

  const query = search.toString();
  return query ? `?${query}` : "";
}

async function parseResponseBody(res) {
  const text = await res.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);
    const payload = await parseResponseBody(res);

    if (!res.ok) {
      let errorMessage = `Request failed: ${res.status}`;

      if (payload && typeof payload === "object") {
        if (payload.error) errorMessage = payload.error;
        if (payload.detail) errorMessage += ` | Detail: ${payload.detail}`;
        if (payload.hint) errorMessage += ` | Hint: ${payload.hint}`;
      } else if (typeof payload === "string" && payload.trim()) {
        errorMessage = payload;
      }

      throw new Error(errorMessage);
    }

    return payload;
  } catch (err) {
    console.error("API Error:", err);
    throw err;
  }
}

function post(endpoint, body) {
  return safeFetch(`${BASE_URL}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function put(endpoint, body) {
  return safeFetch(`${BASE_URL}/${endpoint}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export const getUiConfig = () => safeFetch(`${BASE_URL}/ui-config`);
export const getUsers = () => safeFetch(`${BASE_URL}/users`);
export const getAuthenticatedUser = ({ authToken, loginHint } = {}) =>
  safeFetch(`${BASE_URL}/auth/me`, {
    headers: {
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(loginHint ? { "X-Teams-Login-Hint": loginHint } : {}),
    },
  });
export const getClients = (params = {}) => safeFetch(`${BASE_URL}/clients${buildQueryString(params)}`);
export const getContracts = (params = {}) => safeFetch(`${BASE_URL}/contracts${buildQueryString(params)}`);
export const getMilestones = (params = {}) => safeFetch(`${BASE_URL}/milestones${buildQueryString(params)}`);
export const getHours = (params = {}) => safeFetch(`${BASE_URL}/hours${buildQueryString(params)}`);
export const getBugs = (params = {}) => safeFetch(`${BASE_URL}/requests${buildQueryString(params)}`);

export const createContract = (data) => post("contracts", data);
export const createMilestone = (data) => post("milestones", data);
export const createHourEntry = (data) => post("hours", data);
export const createSubmission = (data) => post("submissions", data);
export const createSubmissionItem = (data) => post("submission-items", data);
export const createBug = (data) => post("requests", data);

export const updateContract = (id, data) => put(`contracts/${id}`, data);
export const updateMilestone = (id, data) => put(`milestones/${id}`, data);
export const updateHourEntry = (id, data) => put(`hours/${id}`, data);
export const updateBug = (id, data) => put(`requests/${id}`, data);

export const completeBug = (id, data = {}) => put(`requests/${id}/complete`, data);
export const markHourSubmitted = (id, data = {}) => put(`hours/${id}/submit`, data);
export const reviewHourEntry = (id, data) => put(`hours/${id}/review`, data);
export const submitContract = (id, data = {}) => put(`contracts/${id}/submit`, data);
export const reviewContract = (id, data) => put(`contracts/${id}/review`, data);
export const reviewMilestone = (id, data) => put(`milestones/${id}/review`, data);

export const softDeleteContract = (id) => put(`contracts/${id}/delete`, {});
export const softDeleteMilestone = (id) => put(`milestones/${id}/delete`, {});
export const softDeleteHour = (id) => put(`hours/${id}/delete`, {});

