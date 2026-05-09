import { API_ENDPOINTS } from "./endpoints";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Алдаа гарлаа");
  }
  return res.json();
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export async function registerUser(data: RegisterInput) {
  return handleResponse<{ message: string; id: string }>(
    await fetch(API_ENDPOINTS.register, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
  );
}
