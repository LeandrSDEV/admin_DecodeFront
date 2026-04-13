// Storage isolado do portal do afiliado.
// Usa chaves diferentes do admin pra que admin e afiliado possam coexistir
// no mesmo navegador (caso o dono do sistema seja afiliado tambem).

const TOKEN_KEY = "decode_affiliate_token";
const PROFILE_KEY = "decode_affiliate_profile";

export type AffiliateProfile = {
  id: string;
  name: string;
  email: string;
  refCode: string;
  status: string;
  mustChangePassword: boolean;
};

export function setAffiliateToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getAffiliateToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAffiliateProfile(p: AffiliateProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

export function getAffiliateProfile(): AffiliateProfile | null {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AffiliateProfile;
  } catch {
    return null;
  }
}

export function clearAffiliateAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PROFILE_KEY);
}

export function isAffiliateAuthenticated(): boolean {
  return !!getAffiliateToken();
}
