export async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      credentials: "include",
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error(
      "Cannot reach ShopKart. Check that the backend is running and try again.",
    );
  }
  const data = await response
    .json()
    .catch(() => ({ message: "Unexpected server response" }));
  if (!response.ok) {
    const error = new Error(data.message || "Request failed");
    error.status = response.status;
    throw error;
  }
  return data;
}
export const jsonBody = (value) => JSON.stringify(value);
