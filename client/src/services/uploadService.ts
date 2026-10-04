import api from "../api/client";

export interface ImageUploadResult {
  message: string;
  secureUrl: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
}

export async function uploadImage(
  file: File
) {
  const formData =
    new FormData();

  formData.append(
    "image",
    file
  );

  const response =
    await api.post<ImageUploadResult>(
      "/uploads/image",
      formData
    );

  return response.data;
}