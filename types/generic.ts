type JobType = "email" | "compressImage" | "sendAP";

interface BaseJob {
  id: string;
  type: JobType;
  payload: any;
  retryCount: number;
  maxRetries: number;
  retryDelayMs: number;
  nextAttemptAt: number;
}
