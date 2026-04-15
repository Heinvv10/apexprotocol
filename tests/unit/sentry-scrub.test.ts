// BL-55: scrub.ts unit tests — validate PII redaction before Bugsink ships.
import { describe, it, expect } from 'vitest';
import type { Event } from '@sentry/nextjs';
import { scrubEvent } from '@/lib/sentry/scrub';

function makeEvent(request: NonNullable<Event['request']>): Event {
  return { request } as Event;
}

describe('scrubEvent', () => {
  it('returns null when event is null', () => {
    expect(scrubEvent(null)).toBeNull();
  });

  it('passes through events without a request surface', () => {
    const evt = { message: 'hello' } as Event;
    expect(scrubEvent(evt)).toBe(evt);
  });

  it('drops cookie, authorization, and x-csrf-token headers (case-insensitive)', () => {
    const evt = makeEvent({
      headers: {
        Cookie: 'session=abc',
        Authorization: 'Bearer xyz',
        'X-CSRF-Token': 't',
        'User-Agent': 'vitest',
      },
    });
    const out = scrubEvent(evt)!;
    expect(out.request!.headers).toEqual({ 'User-Agent': 'vitest' });
  });

  it('redacts sensitive keys in request body', () => {
    const evt = makeEvent({
      data: {
        username: 'alice',
        password: 'hunter2',
        apiToken: 'tok_123',
        bank_account_number: '1234567890',
        nested: { secret: 's', ok: 'ok' },
      },
    });
    const out = scrubEvent(evt)!;
    const data = out.request!.data as Record<string, unknown>;
    expect(data.username).toBe('alice');
    expect(data.password).toBe('[REDACTED]');
    expect(data.apiToken).toBe('[REDACTED]');
    expect(data.bank_account_number).toBe('[REDACTED]');
    expect((data.nested as Record<string, unknown>).secret).toBe('[REDACTED]');
    expect((data.nested as Record<string, unknown>).ok).toBe('ok');
  });

  it('hashes email local-part deterministically while preserving the domain', () => {
    const evt = makeEvent({ data: { email: 'alice@example.com' } });
    const out = scrubEvent(evt)!;
    const data = out.request!.data as Record<string, string>;
    expect(data.email).not.toBe('alice@example.com');
    expect(data.email).toMatch(/^[0-9a-f]{8}@example\.com$/);

    // Deterministic: same input -> same hash
    const again = scrubEvent(makeEvent({ data: { email: 'alice@example.com' } }))!;
    expect((again.request!.data as Record<string, string>).email).toBe(data.email);
  });

  it('redacts sensitive query-string params but leaves benign ones intact', () => {
    const evt = makeEvent({
      query_string: 'q=hello&password=secret&token=abc&page=2&iban=xx',
    });
    const out = scrubEvent(evt)!;
    expect(out.request!.query_string).toBe(
      'q=hello&password=[REDACTED]&token=[REDACTED]&page=2&iban=[REDACTED]',
    );
  });

  it('handles circular references in the body without crashing', () => {
    const node: Record<string, unknown> = { name: 'n' };
    node.self = node;
    const evt = makeEvent({ data: { node } });
    const out = scrubEvent(evt)!;
    const scrubbedNode = (out.request!.data as Record<string, Record<string, unknown>>).node;
    expect(scrubbedNode.name).toBe('n');
    expect(scrubbedNode.self).toBe('[CIRCULAR]');
  });
});
