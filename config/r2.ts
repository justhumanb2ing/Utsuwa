import { S3Client } from "@aws-sdk/client-s3";

let client: S3Client | null = null;

const getEnv = (key: string, message: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(message);
  }
  return value;
};

export const getR2Client = () => {
  if (client) {
    return client;
  }

  const endpoint = getEnv(
    "R2_ENDPOINT",
    "R2_ENDPOINT 환경 변수가 설정되지 않았습니다."
  );
  const accessKeyId = getEnv(
    "R2_ACCESS_KEY_ID",
    "R2_ACCESS_KEY_ID 환경 변수가 설정되지 않았습니다."
  );
  const secretAccessKey = getEnv(
    "R2_SECRET_ACCESS_KEY",
    "R2_SECRET_ACCESS_KEY 환경 변수가 설정되지 않았습니다."
  );

  client = new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return client;
};
