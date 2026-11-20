import 'server-only';
import { NextResponse } from 'next/server';
import type { z } from 'zod';
import { firstIssue } from '@/shared/validation';

/**
 * Small HTTP toolkit for route handlers.
 * Success responses are `{ data }`; failures are `{ error: { message } }` with a matching status.
 */
export class HttpError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ data }, init);
}

export function fail(status: number, message: string): NextResponse {
  return NextResponse.json({ error: { message } }, { status });
}

/** Wraps a handler so thrown HttpErrors become JSON errors and anything else becomes a logged 500. */
export function route<Args extends unknown[]>(handler: (...args: Args) => Promise<Response>) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof HttpError) return fail(error.status, error.message);
      console.error('Unhandled API error:', error);
      return fail(500, 'Something went wrong on our side. Please try again.');
    }
  };
}

/** Reads and validates a JSON body, enforcing a size limit before parsing. */
export async function readJson<S extends z.ZodType>(req: Request, schema: S, maxBytes = 64_000): Promise<z.infer<S>> {
  const text = await req.text();
  if (text.length > maxBytes) throw new HttpError(413, 'Request body is too large.');
  let raw: unknown;
  try {
    raw = text ? JSON.parse(text) : {};
  } catch {
    throw new HttpError(400, 'Request body must be valid JSON.');
  }
  const result = schema.safeParse(raw);
  if (!result.success) throw new HttpError(400, firstIssue(result.error));
  return result.data;
}
