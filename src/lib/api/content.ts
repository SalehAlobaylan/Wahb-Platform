/**
 * Client-side helper for the user-submitted content endpoint.
 *
 * Wraps the multipart upload to /api/content/submit so callers can pass a
 * plain { title, bodyText, audioBlob } object. The proxy reads the access
 * token from cookies before forwarding to CMS.
 */
export interface PublishContentInput {
    title: string;
    bodyText?: string;
    audioBlob?: Blob;
    audioFilename?: string;
}

export interface PublishContentResponse {
    id: string;
    status: 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED' | 'ARCHIVED';
}

export async function publishContent(
    input: PublishContentInput
): Promise<PublishContentResponse> {
    const form = new FormData();
    form.set('title', input.title.trim());
    if (input.bodyText && input.bodyText.trim()) {
        form.set('body_text', input.bodyText.trim());
    }
    if (input.audioBlob) {
        const filename = input.audioFilename ?? 'voice-layer.webm';
        form.set('audio_file', input.audioBlob, filename);
    }

    const res = await fetch('/api/content/submit', {
        method: 'POST',
        body: form,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to publish' }));
        throw new Error(err.message || `Failed to publish (HTTP ${res.status})`);
    }
    return res.json();
}

/**
 * Decode a data URL (returned by FileReader.readAsDataURL) back into a Blob
 * for upload. Returns null when the input is not a usable data URL.
 */
export function dataUrlToBlob(dataUrl: string | null): Blob | null {
    if (!dataUrl) return null;
    const match = /^data:([^;]+);base64,(.*)$/i.exec(dataUrl);
    if (!match) return null;
    const [, mime, b64] = match;
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
}
