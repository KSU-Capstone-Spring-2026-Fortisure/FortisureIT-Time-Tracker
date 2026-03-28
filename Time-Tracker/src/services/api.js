// const API_BASE = "http://localhost:5000"; // update with backend localhost later

// export async function Example() {
//     const result = await fetch(`${API_BASE}/example`);
//     return result.json();
// }

const BASE_URL = "https://time-tracker-api-c9bvg4ayekdkcef0.eastus-01.azurewebsites.net";

// GET contracts
export const getContracts = async () => {
  const response = await fetch(`${BASE_URL}/contracts`);
  if (!response.ok) throw new Error("Failed to fetch contracts");
  return response.json();
};

// CREATE contract
export const createContract = async (contract) => {
  const response = await fetch(`${BASE_URL}/contracts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(contract),
  });
  return response.json();
};

// UPDATE contract
export const updateContract = async (id, contract) => {
  const response = await fetch(`${BASE_URL}/contracts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(contract),
  });
  return response.json();
};

// DELETE contract
export const deleteContract = async (id) => {
  await fetch(`${BASE_URL}/contracts/${id}`, {
    method: "DELETE",
  });
};