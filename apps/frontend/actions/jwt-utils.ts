export function decodeJwt(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid JWT format");
    }

    const payload = parts[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
}

export function getUserFromToken(token: string) {
  const decoded = decodeJwt(token);

  if (!decoded) return null;

  return {
    id: decoded.sub,
    email: decoded.email,
    name: decoded.name,
    mobileNumber: decoded.mobileNumber,
    roles: decoded.roles.rolename,
    isAdmin:
      decoded.roles?.rolename === "admin" ||
      decoded.roles?.rolename === "superadmin" ||
      decoded.roles?.rolename === "modaretor" ||
      false,
    exp: decoded.exp,
    createdAt: decoded?.createdAt,
  };
}

export function isTokenExpired(token: string) {
  const decoded = decodeJwt(token);
  if (!decoded || !decoded.exp) return true;

  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
}
