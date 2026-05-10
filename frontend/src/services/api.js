import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8001",
  timeout: 300000,
});

export async function generateCaptions({ file, mode }) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("mode", mode);

  const response = await api.post("/generate-captions", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
}

export function getApiErrorMessage(error) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (Array.isArray(detail) && detail.length > 0) {
      return detail[0]?.msg || "The request could not be processed.";
    }
    if (typeof detail === "string") {
      return detail;
    }
    if (error.code === "ECONNABORTED") {
      return "Caption generation timed out. Try a smaller image or run the backend on a faster device.";
    }
    if (!error.response) {
      return "Could not reach the backend. Confirm FastAPI is running on the configured API URL.";
    }
  }

  return "Something went wrong while generating captions.";
}
