const BASE_URL = "https://time-tracker-api-c9bvg4ayekdkcef0.eastus-01.azurewebsites.net";

async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Request failed: ${res.status}`);
    }

    return res.json();
  } catch (err) {
    console.error("API Error:", err);
    throw err;
  }
}

// GENERIC HELPERS

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

// GET

export const getUsers = () => safeFetch(`${BASE_URL}/users`);
export const getClients = () => safeFetch(`${BASE_URL}/clients`);
export const getContracts = () => safeFetch(`${BASE_URL}/contracts`);
export const getMilestones = () => safeFetch(`${BASE_URL}/milestones`);
export const getHours = () => safeFetch(`${BASE_URL}/hours`);
export const getBugs = () => safeFetch(`${BASE_URL}/requests`);

// CREATE

export const createContract = (data) => post("contracts", data);
export const createMilestone = (data) => post("milestones", data);
export const createHourEntry = (data) => post("hours", data);

export const createSubmission = (data) => post("submissions", data);
export const createSubmissionItem = (data) => post("submission-items", data);

export const createBug = (data) =>
  post("requests", {
    user_id: 1,
    request_type: "Bug",
    title: data.title,
    severity: data.severity,
    description: data.description,
  });

// UPDATE

export const updateContract = (id, data) => put(`contracts/${id}`, data);
export const updateMilestone = (id, data) => put(`milestones/${id}`, data);
export const updateHourEntry = (id, data) => put(`hours/${id}`, data);

export const updateBug = (id, data) =>
  put(`requests/${id}`, {
    title: data.title,
    severity: data.severity,
    description: data.description,
    complete: data.complete,
  });

export const completeBug = (id) =>
  put(`requests/${id}/complete`);

export const markHourSubmitted = (id) =>
  put(`hours/${id}/submit`, {});


// SOFT DELETE

export const softDeleteContract = (id) => put(`contracts/${id}/delete`);
export const softDeleteMilestone = (id) => put(`milestones/${id}/delete`);
export const softDeleteHour = (id) => put(`hours/${id}/delete`);