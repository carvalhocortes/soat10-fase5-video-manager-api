import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { UploadRequest } from '../../validation/uploadValidation';
import { S3UploadService } from '../S3UploadService';

// Mock do AWS SDK
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');

const mockedGetSignedUrl = jest.mocked(getSignedUrl);
(S3Client as jest.Mock).mockImplementation(() => ({}));

describe('S3UploadService', () => {
  let s3Service: S3UploadService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation();
    s3Service = new S3UploadService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
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

    it('should handle various video formats', async () => {
      const videoFormats = [
        { fileName: 'test.mp4', fileType: 'video/mp4' },
        { fileName: 'test.avi', fileType: 'video/avi' },
        { fileName: 'test.mov', fileType: 'video/quicktime' },
        { fileName: 'test.webm', fileType: 'video/webm' },
      ];

      const expectedUrl = 'https://presigned-url.com';
      mockedGetSignedUrl.mockResolvedValue(expectedUrl);

      for (const format of videoFormats) {
        const mockRequest: UploadRequest = {
          ...format,
          fileSize: 50 * 1024 * 1024,
          userId: 'user123',
        };

        const result = await s3Service.generateUploadUrl(mockRequest);
        expect(result.uploadUrl).toBe(expectedUrl);
      }
    });

    it('should generate unique file keys for same filename', async () => {
      const mockRequest: UploadRequest = {
        fileName: 'test.mp4',
        fileType: 'video/mp4',
        fileSize: 50 * 1024 * 1024,
        userId: 'user123',
      };

      mockedGetSignedUrl.mockResolvedValue('https://presigned-url.com');

      const result1 = await s3Service.generateUploadUrl(mockRequest);
      const result2 = await s3Service.generateUploadUrl(mockRequest);

      expect(result1.fileKey).not.toBe(result2.fileKey);
      expect(result1.fileKey).toContain('uploads/user123/');
      expect(result2.fileKey).toContain('uploads/user123/');
    });
  });

  describe('generateDownloadUrl', () => {
    it('should generate a download URL for a valid file key', async () => {
      const fileKey = 'uploads/user123/test-video.mp4';
      const fileName = 'test-video.mp4';
      const expectedUrl = 'https://download-url.com';
      mockedGetSignedUrl.mockResolvedValue(expectedUrl);

      const result = await s3Service.generateDownloadUrl(fileKey, fileName);

      expect(result).toHaveProperty('downloadUrl', expectedUrl);
      expect(result).toHaveProperty('fileName', fileName);
      expect(result).toHaveProperty('expiresIn', 3600);
      expect(mockedGetSignedUrl).toHaveBeenCalledTimes(1);
    });

    it('should handle getSignedUrl errors', async () => {
      const fileKey = 'uploads/user123/test-video.mp4';
      const fileName = 'test-video.mp4';
      const error = new Error('S3 service unavailable');
      mockedGetSignedUrl.mockRejectedValue(error);

      await expect(s3Service.generateDownloadUrl(fileKey, fileName)).rejects.toThrow(
        'Failed to generate download URL. Please try again.',
      );
    });

    it('should handle special characters in filename', async () => {
      const fileKey = 'uploads/user123/test-video.mp4';
      const fileName = 'test video (1).mp4';
      const expectedUrl = 'https://download-url.com';
      mockedGetSignedUrl.mockResolvedValue(expectedUrl);

      const result = await s3Service.generateDownloadUrl(fileKey, fileName);

      expect(result.fileName).toBe(fileName);
      expect(mockedGetSignedUrl).toHaveBeenCalledTimes(1);
    });
  });
});
