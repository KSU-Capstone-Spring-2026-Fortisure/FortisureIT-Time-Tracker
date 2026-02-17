const API_BASE = "http://localhost:5000"; // update with backend localhost later

export async function Example() {
    const result = await fetch(`${API_BASE}/example`);
    return result.json();
}