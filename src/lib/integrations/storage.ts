import "server-only";

/**
 * File storage adapter.
 *
 * Default: simulated (stores only the file's metadata in the DB).
 * To go live: set S3_BUCKET (+ AWS creds) in .env and run `npm i @aws-sdk/client-s3`.
 * See INTEGRATIONS.md.
 */

export type UploadInput = {
  name: string;
  bytes: Buffer | Uint8Array;
  contentType: string;
};

export type UploadResult = { url: string; simulated: boolean };

export function storageConfigured(): boolean {
  return Boolean(process.env.S3_BUCKET && process.env.AWS_ACCESS_KEY_ID);
}

export async function uploadFile(input: UploadInput): Promise<UploadResult> {
  if (!storageConfigured()) {
    // --- Simulated path (default): no bytes are persisted. ---
    return { url: `/uploads/${encodeURIComponent(input.name)}`, simulated: true };
  }

  // --- Real path: AWS S3 (or any S3-compatible store like R2/Backblaze) ---
  try {
    const specifier = "@aws-sdk/client-s3";
    const { S3Client, PutObjectCommand } = await import(specifier);
    const region = process.env.AWS_REGION ?? "us-east-1";
    const bucket = process.env.S3_BUCKET as string;
    const client = new S3Client({ region });
    const key = `${Date.now()}-${input.name}`;
    await client.send(
      new PutObjectCommand({ Bucket: bucket, Key: key, Body: input.bytes, ContentType: input.contentType })
    );
    const base = process.env.S3_PUBLIC_URL ?? `https://${bucket}.s3.${region}.amazonaws.com`;
    return { url: `${base}/${key}`, simulated: false };
  } catch (err) {
    throw new Error(
      "S3 is configured but the upload failed. Run `npm i @aws-sdk/client-s3`, " +
        `verify your bucket/credentials, and see INTEGRATIONS.md. Original error: ${(err as Error).message}`
    );
  }
}
