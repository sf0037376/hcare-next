import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

export function setToken(token) {
  Cookies.set("token", token, { expires: 7 });
}

export function logout() {
  Cookies.remove("token");
  window.location.href = "/login";
}

export function getUser() {
  const token = Cookies.get("token");
  if (!token) return null;
  return jwtDecode(token);
}
