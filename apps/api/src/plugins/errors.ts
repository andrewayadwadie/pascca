// 003-auth-authorization (T009, Art 10 [NN]): the enveloped-response contract every route in
// this codebase follows, both halves of it.
//
// The success half is deliberately NOT a `preSerialization` hook — that was tried and reverted:
// it wraps the payload at runtime but a Zod `response` schema still describes the UNwrapped
// handler return type to `fastify-type-provider-zod`'s type inference, so the two disagree and
// every route stops type-checking against its own declared response. `ok()`/`okWithMeta()` below
// are the one-line alternative: a handler returns `ok(data)`, which both IS the exact runtime
// envelope AND matches `envelope(dataSchema)`'s declared type — no hook, no mismatch.
//
// `AppError` is the one way a route/service signals a registered failure; anything else that
// reaches the error handler is, by Article 10's own definition, a bug — it's still answered
// safely (INTERNAL_ERROR, 500), logged with the real stack, but never with the raw error message
// or stack leaked to the client (that would be exactly the kind of internal detail a client is
// never supposed to switch on, and can leak infrastructure details).
import fp from "fastify-plugin";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z, type ZodTypeAny } from "zod";

export function envelope<T extends ZodTypeAny>(dataSchema: T) {
  return z.object({ success: z.literal(true), data: dataSchema });
}

export function envelopeWithMeta<T extends ZodTypeAny, M extends ZodTypeAny>(dataSchema: T, metaSchema: M) {
  return z.object({ success: z.literal(true), data: dataSchema, meta: metaSchema });
}

export function ok<T>(data: T): { success: true; data: T } {
  return { success: true, data };
}

export function okWithMeta<T, M>(data: T, meta: M): { success: true; data: T; meta: M } {
  return { success: true, data, meta };
}

export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: unknown[];

  constructor(code: string, status: number, message: string, details: unknown[] = []) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

interface ErrorEnvelope {
  success: false;
  error: { code: string; message: string; details: unknown[] };
}

export function errorEnvelope(code: string, message: string, details: unknown[] = []): ErrorEnvelope {
  return { success: false, error: { code, message, details } };
}

export default fp(async function errorsPlugin(app: FastifyInstance) {
  app.setErrorHandler((error: Error & { validation?: unknown[]; statusCode?: number }, request: FastifyRequest, reply: FastifyReply) => {
    if (error instanceof AppError) {
      return reply.code(error.status).send(errorEnvelope(error.code, error.message, error.details));
    }

    // Fastify's normalized shape for a schema-validation failure — populated the same way
    // regardless of which validator compiled the schema (fastify-type-provider-zod included).
    if (error.validation) {
      return reply
        .code(400)
        .send(errorEnvelope("VALIDATION_FAILED", "Request failed validation", error.validation));
    }

    request.log.error(error, "unhandled error");
    return reply.code(500).send(errorEnvelope("INTERNAL_ERROR", "Something went wrong"));
  });

  app.setNotFoundHandler((_request: FastifyRequest, reply: FastifyReply) => {
    return reply.code(404).send(errorEnvelope("NOT_FOUND", "Route not found"));
  });
});
