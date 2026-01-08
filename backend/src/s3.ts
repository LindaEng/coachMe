function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  AWS_REGION: requireEnv("AWS_REGION"),
  AWS_ACCESS_KEY_ID: requireEnv("AWS_ACCESS_KEY_ID"),
  AWS_SECRET_ACCESS_KEY: requireEnv("AWS_SECRET_ACCESS_KEY"),
  S3_BUCKET_NAME: requireEnv("S3_BUCKET_NAME"),
};
