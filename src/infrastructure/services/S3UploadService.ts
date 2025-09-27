import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { UploadRequest, validateUploadRequest } from '../validation/uploadValidation';

export interface UploadResponse {
  uploadUrl: string;
  fileKey: string;
  expiresIn: number;
}

export interface DownloadResponse {
  downloadUrl: string;
  fileName: string;
  expiresIn: number;
}

export class S3UploadService {
  private s3Client: S3Client;
  private bucketName: string;
  private urlExpirationTime: number = 3600;

  constructor() {
    this.bucketName = process.env.S3_BUCKET_NAME!;
    this.s3Client = new S3Client({ region: process.env.AWS_REGION! });
  }

  private async validateFile(request: UploadRequest): Promise<void> {
    await validateUploadRequest(request);
  }

  private generateFileKey(request: UploadRequest): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 15);
    const sanitizedFileName = request.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');

    return `uploads/${request.userId}/${timestamp}-${randomSuffix}-${sanitizedFileName}`;
  }

  async generateUploadUrl(request: UploadRequest): Promise<UploadResponse> {
    await this.validateFile(request);
    const fileKey = this.generateFileKey(request);
    const putObjectCommand = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      ContentType: request.fileType,
      Metadata: {
        userId: request.userId,
        originalFileName: request.fileName,
        uploadTimestamp: new Date().toISOString(),
      },
    });

    try {
      const uploadUrl = await getSignedUrl(this.s3Client, putObjectCommand, {
        expiresIn: this.urlExpirationTime,
      });

      return {
        uploadUrl,
        fileKey,
        expiresIn: this.urlExpirationTime,
      };
    } catch (error) {
      console.error('Error generating upload URL:', error);
      throw new Error('Failed to generate upload URL. Please try again.');
    }
  }

  async generateDownloadUrl(s3Key: string, fileName: string): Promise<DownloadResponse> {
    const getObjectCommand = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
      ResponseContentDisposition: `attachment; filename="${fileName}"`,
    });

    try {
      const downloadUrl = await getSignedUrl(this.s3Client, getObjectCommand, {
        expiresIn: this.urlExpirationTime,
      });

      return {
        downloadUrl,
        fileName,
        expiresIn: this.urlExpirationTime,
      };
    } catch (error) {
      console.error('Error generating download URL:', error);
      throw new Error('Failed to generate download URL. Please try again.');
    }
  }
}
