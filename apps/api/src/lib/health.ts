// FR-014, research R6 (clarification 2026-08-10): each dependency is checked ONCE. Any failure
// prints the unreachable service by name and the caller exits. No backoff, no retry loop — one
// consistent fail-fast philosophy across configuration errors (env.ts) and connectivity errors
// (here), and deterministic to test (a retry loop would turn the test into a timing race).
import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";
import { Client as PgClient } from "pg";
import Redis from "ioredis";
import type { Env } from "../config/env.ts";

const CONNECT_TIMEOUT_MS = 3000;

export interface ServiceCheck {
  service: "postgres" | "redis" | "object storage";
  ok: boolean;
  error?: string;
}

async function checkPostgres(databaseUrl: string): Promise<ServiceCheck> {
  const client = new PgClient({ connectionString: databaseUrl, connectionTimeoutMillis: CONNECT_TIMEOUT_MS });
  try {
    await client.connect();
    await client.query("SELECT 1");
    return { service: "postgres", ok: true };
  } catch (err) {
    return { service: "postgres", ok: false, error: err instanceof Error ? err.message : String(err) };
  } finally {
    await client.end().catch(() => {
      // Already failed to connect — nothing to clean up.
    });
  }
}

async function checkRedis(redisUrl: string): Promise<ServiceCheck> {
  const client = new Redis(redisUrl, {
    connectTimeout: CONNECT_TIMEOUT_MS,
    maxRetriesPerRequest: 0, // single shot — no retry (FR-014)
    retryStrategy: () => null, // disable ioredis's own reconnect-with-backoff entirely
    lazyConnect: true,
  });
  // ioredis emits 'error' as an EventEmitter event independently of the connect()/ping()
  // promise rejection path. An EventEmitter's default behaviour for an unlistened 'error'
  // event is to throw — which could crash the real process on a Redis outage. The failure is
  // already handled via the catch block below; this listener exists only to prevent that.
  client.on("error", () => {
    // Intentionally empty — see comment above.
  });
  try {
    await client.connect();
    await client.ping();
    return { service: "redis", ok: true };
  } catch (err) {
    return { service: "redis", ok: false, error: err instanceof Error ? err.message : String(err) };
  } finally {
    client.disconnect();
  }
}

async function checkObjectStorage(env: Pick<Env, "S3_ENDPOINT" | "S3_REGION" | "S3_ACCESS_KEY_ID" | "S3_SECRET_ACCESS_KEY" | "S3_BUCKET">): Promise<ServiceCheck> {
  const client = new S3Client({
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    forcePathStyle: true, // required for MinIO; harmless for R2
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
    requestHandler: { requestTimeout: CONNECT_TIMEOUT_MS },
  });
  try {
    await client.send(new HeadBucketCommand({ Bucket: env.S3_BUCKET }));
    return { service: "object storage", ok: true };
  } catch (err) {
    return { service: "object storage", ok: false, error: err instanceof Error ? err.message : String(err) };
  } finally {
    client.destroy();
  }
}

/**
 * Checks Postgres, Redis, and object storage reachability — each once, no retry. Returns the
 * results for ALL three checks (does not short-circuit on the first failure) so a caller can
 * report every unreachable service in one pass, matching env.ts's "report all problems at once"
 * behaviour.
 */
export async function checkInfrastructure(env: Env): Promise<ServiceCheck[]> {
  return Promise.all([checkPostgres(env.DATABASE_URL), checkRedis(env.REDIS_URL), checkObjectStorage(env)]);
}
