import { API_BASE_URL } from "../config/env";

export const getAvatarUrl = (avatar) => {
  if (!avatar) return "";

  const url = typeof avatar === "object" ? avatar.url : avatar;

  if (!url || typeof url !== "string") return "";
  if (url.startsWith("http") || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }

  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};
