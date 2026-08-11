// Shared valid-environment fixture — every test that needs the API to boot successfully starts
// here, so the 12-key contract (contracts/env.md) is defined once, not duplicated per test file.
export const VALID_ENV: NodeJS.ProcessEnv = {
  NODE_ENV: "test",
  PORT: "3999",
  HOST: "127.0.0.1",
  LOG_LEVEL: "silent",
  DATABASE_URL: "postgresql://user:pw@localhost:5432/db",
  REDIS_URL: "redis://localhost:6379",
  S3_ENDPOINT: "http://localhost:9000",
  S3_REGION: "auto",
  S3_ACCESS_KEY_ID: "key",
  S3_SECRET_ACCESS_KEY: "secret",
  S3_BUCKET: "bucket",
  CORS_ORIGINS: "http://localhost:3000",
  // 003-auth-authorization: JWT access-token + refresh-cookie signing secrets. Test-only
  // values — never real secrets (Article 29 [NN]).
  JWT_ACCESS_SECRET: "test-jwt-access-secret-32-characters-minimum",
  COOKIE_SECRET: "test-cookie-secret-32-characters-minimum-ok",
};
