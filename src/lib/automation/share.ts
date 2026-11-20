import { parseCircuitDocument } from './documents.ts';
import type { CircuitDocument } from './types.ts';

/**
 * Shareable circuit links. The circuit is compressed (deflate) and base64url-encoded into the
 * URL fragment: /lab#c=1.<payload>. Fragments are never sent to the server, so sharing needs no
 * account or database, and the receiver always gets an independent copy.
 */

const PREFIX = 'c=1.';
const MAX_PAYLOAD_CHARS = 200_000;
const MAX_JSON_BYTES = 2_000_000;

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]*$/.test(text)) throw new Error('This link is damaged (invalid characters).');
  const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function pipe(bytes: Uint8Array, transform: CompressionStream | DecompressionStream, limit = Infinity): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(transform);
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > limit) {
      await reader.cancel();
      throw new Error('This shared circuit is too large to open.');
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

/** Only what is needed to rebuild the circuit; simulation state is never shared. */
function portable(doc: CircuitDocument): CircuitDocument {
  return {
    version: 1,
    name: doc.name,
    blocks: doc.blocks.map((block) => ({
      id: block.id,
      type: block.type,
      position: { x: Math.round(block.position.x), y: Math.round(block.position.y) },
      ...(block.label !== undefined ? { label: block.label } : {}),
      ...(block.tag ? { tag: block.tag } : {}),
      ...(block.value !== undefined ? { value: block.value } : {}),
      params: block.params,
    })),
    connections: doc.connections,
    ...(doc.widgets?.length ? { widgets: doc.widgets } : {}),
  };
}

export async function encodeCircuitFragment(doc: CircuitDocument): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(portable(doc)));
  const compressed = await pipe(json, new CompressionStream('deflate-raw'));
  return `${PREFIX}${toBase64Url(compressed)}`;
}

/** Returns the circuit in a URL fragment (with or without the leading '#'), or null if there is none. */
export async function decodeCircuitFragment(fragment: string): Promise<CircuitDocument | null> {
  const value = fragment.startsWith('#') ? fragment.slice(1) : fragment;
  if (!value.startsWith('c=')) return null;
  if (!value.startsWith(PREFIX)) throw new Error('This link was made by a newer version of the site.');
  const payload = value.slice(PREFIX.length);
  if (payload.length > MAX_PAYLOAD_CHARS) throw new Error('This shared circuit is too large to open.');
  const compressed = fromBase64Url(payload);
  let json: string;
  try {
    json = new TextDecoder().decode(await pipe(compressed, new DecompressionStream('deflate-raw'), MAX_JSON_BYTES));
  } catch (error) {
    if (error instanceof Error && error.message.includes('too large')) throw error;
    throw new Error('This link is damaged or incomplete. Ask for a fresh link.');
  }
  // Same validation as importing a file: block types, parameters, wiring, size limits.
  return parseCircuitDocument(json);
}

export async function buildShareUrl(origin: string, doc: CircuitDocument): Promise<string> {
  return `${origin}/lab#${await encodeCircuitFragment(doc)}`;
}

const escapeAttribute = (text: string) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** HTML to paste into a blog or LMS page: an interactive, read-only copy of the shared circuit. */
export function buildEmbedCode(shareUrl: string, title: string): string {
  const embedUrl = shareUrl.replace('/lab#', '/embed#');
  return `<iframe src="${escapeAttribute(embedUrl)}" title="${escapeAttribute(title || 'Logic circuit')}" width="100%" height="480" style="border:1px solid #e5e5ea;border-radius:12px" loading="lazy"></iframe>`;
}
