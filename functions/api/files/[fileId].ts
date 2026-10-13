import { getFile, handleOptions, jsonResponse } from '../../shared/store';

export const onRequestOptions = () => handleOptions();

export const onRequestGet = async (context: {
  params: { fileId?: string | string[] };
  env?: { CIPHERCHAT_KV?: any };
}) => {
  try {
    const rawFileId = context.params.fileId;
    const fileId = Array.isArray(rawFileId) ? rawFileId[0] : rawFileId;

    if (!fileId || typeof fileId !== 'string') {
      return jsonResponse({ error: 'Invalid file ID' }, 400);
    }

    const file = await getFile(fileId, context.env?.CIPHERCHAT_KV);
    if (!file) {
      return jsonResponse({ error: 'File not found or expired' }, 404);
    }

    return new Response(file.data, {
      status: 200,
      headers: {
        'Content-Type': file.mimetype,
        'Content-Length': file.size.toString(),
        'Cache-Control': 'private, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Content-Disposition': `inline; filename="${encodeURIComponent(file.filename)}"`,
      },
    });
  } catch {
    return jsonResponse({ error: 'Failed to retrieve file' }, 500);
  }
};
