import apiClient from "@/services/api/client";

type PersonaModel = {
  _id?: string;
  name?: string;
  colors?: Record<string, string>;
};

export type AuthUser = {
  _id: string;
  email: string;
  username?: string;
  role?: string;
  profilePicture?: string;
  activeAbelPersona?: PersonaModel | null;
  pokemonCollection?: unknown[];
  snoopyArtCollection?: unknown[];
  habboRares?: unknown[];
  badges?: unknown[];
  [key: string]: unknown;
};

type AwardedBadge = {
  badgeId?: string;
  name?: string;
  imageUrl?: string;
  spriteSmallUrl?: string;
};

type AuthEnvelope = {
  success?: boolean;
  token?: string;
  data?: AuthUser;
  awardedBadge?: AwardedBadge | null;
};

type MeEnvelope = {
  success?: boolean;
  data?: AuthUser;
};

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = {
  email: string;
  username: string;
  password: string;
};

type AuthResult = {
  token: string;
  user: AuthUser;
  awardedBadge?: AwardedBadge | null;
};

function normalizeAuthEnvelope(envelope: AuthEnvelope): AuthResult {
  if (!envelope.token || !envelope.data) {
    throw new Error("Invalid auth response from server");
  }

  return {
    token: envelope.token,
    user: envelope.data,
    awardedBadge: envelope.awardedBadge ?? null,
  };
}

export async function loginRequest(payload: LoginPayload) {
  const response = await apiClient.post<AuthEnvelope>("/auth/login", payload);
  return normalizeAuthEnvelope(response.data);
}

export async function registerRequest(payload: RegisterPayload) {
  const response = await apiClient.post<AuthEnvelope>("/auth/register", payload);
  return normalizeAuthEnvelope(response.data);
}

export async function fetchCurrentUser() {
  const response = await apiClient.get<MeEnvelope>("/auth/me");

  if (!response.data.data) {
    throw new Error("Invalid /auth/me response from server");
  }

  return response.data.data;
}