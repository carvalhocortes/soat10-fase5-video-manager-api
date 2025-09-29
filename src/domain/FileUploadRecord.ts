export interface FileUploadRecord {
  fileId: string;
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  s3Key: string;
  processedFileS3Key?: string;
  status: FileUploadRecordStatus;
  uploadUrl?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: number;
}

export enum FileUploadRecordStatus {
  PENDING = 'PENDING',
  UPLOADED = 'UPLOADED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

export interface CreateFileUploadRequest {
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  s3Key: string;
  uploadUrl: string;
}
