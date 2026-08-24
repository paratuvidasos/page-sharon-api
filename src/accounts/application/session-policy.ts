export const ACCESS_TOKEN_TTL_MINUTES = Number(process.env.JWT_ACCESS_TOKEN_TTL_MINUTES ?? 15);
export const REFRESH_TOKEN_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 1);
export const REFRESH_TOKEN_REMEMBER_ME_TTL_DAYS = Number(
  process.env.REFRESH_TOKEN_REMEMBER_ME_TTL_DAYS ?? 30,
);
