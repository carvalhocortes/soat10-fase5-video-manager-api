import { S3UploadService } from '../S3UploadService';
import { UploadRequest } from '../../validation/uploadValidation';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client } from '@aws-sdk/client-s3';

// Mock do AWS SDK
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');

const mockedGetSignedUrl = jest.mocked(getSignedUrl);
(S3Client as jest.Mock).mockImplementation(() => ({}));

describe('S3UploadService', () => {
  let s3Service: S3UploadService;

  beforeEach(() => {
    jest.clearAllMocks();
    s3Service = new S3UploadService();
  });

  describe('generateUploadUrl', () => {
    it('should generate an upload URL for a valid file', async () => {
      const mockRequest: UploadRequest = {
        fileName: 'test-video.mp4',
        fileType: 'video/mp4',
        fileSize: 50 * 1024 * 1024, // 50MB
        userId: 'user123',
      };

      const expectedUrl = 'https://presigned-url.com';
      mockedGetSignedUrl.mockResolvedValue(expectedUrl);

      const result = await s3Service.generateUploadUrl(mockRequest);

      expect(result).toHaveProperty('uploadUrl', expectedUrl);
      expect(result).toHaveProperty('fileKey');
      expect(result).toHaveProperty('expiresIn', 3600);
      expect(result.fileKey).toContain('uploads/user123/');
      expect(result.fileKey).toContain('test-video.mp4');
    });

    it('should reject file with size too large', async () => {
      const mockRequest: UploadRequest = {
        fileName: 'large-video.mp4',
        fileType: 'video/mp4',
        fileSize: 2 * 1024 * 1024 * 1024, // 2GB (above the 1GB limit)
        userId: 'user123',
      };

      await expect(s3Service.generateUploadUrl(mockRequest)).rejects.toThrow('File too large');
    });

    it('should reject file with invalid MIME type', async () => {
      const mockRequest: UploadRequest = {
        fileName: 'document.pdf',
        fileType: 'application/pdf',
        userId: 'user123',
      };

      await expect(s3Service.generateUploadUrl(mockRequest)).rejects.toThrow('File type not allowed');
    });

    it('should reject file with invalid file extension', async () => {
      const mockRequest: UploadRequest = {
        fileName: 'video.txt',
        fileType: 'video/mp4',
        userId: 'user123',
      };

      await expect(s3Service.generateUploadUrl(mockRequest)).rejects.toThrow('File extension not allowed');
    });

    it('should reject request without file name', async () => {
      const mockRequest: UploadRequest = {
        fileName: '',
        fileType: 'video/mp4',
        userId: 'user123',
      };

      await expect(s3Service.generateUploadUrl(mockRequest)).rejects.toThrow('File name is required');
    });

    it('should reject request without user ID', async () => {
      const mockRequest: UploadRequest = {
        fileName: 'video.mp4',
        fileType: 'video/mp4',
        userId: '',
      };

      await expect(s3Service.generateUploadUrl(mockRequest)).rejects.toThrow('User ID is required');
    });
  });
});
