import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { UploadStatus } from '../../../domain/FileUploadRecord';
import { FileUploadRepository } from '../FileUploadRepository';

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');

const mockSend = jest.fn();
const mockFrom = jest.fn(() => ({ send: mockSend }));

(DynamoDBClient as jest.Mock).mockImplementation(() => ({}));
(DynamoDBDocumentClient.from as jest.Mock) = mockFrom;

describe('FileUploadRepository', () => {
  let repository: FileUploadRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockClear();
    jest.spyOn(console, 'error').mockImplementation();
    repository = new FileUploadRepository();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createFileUpload', () => {
    it('should create a new upload record with PENDING status', async () => {
      const mockRequest = {
        userId: 'user-123',
        fileName: 'test-video.mp4',
        fileType: 'video/mp4',
        fileSize: 1024000,
        s3Key: 'uploads/user-123/test-video.mp4',
        uploadUrl: 'https://presigned-url.com',
      };

      // Mock successful DynamoDB response
      mockSend.mockResolvedValueOnce({});

      const result = await repository.createFileUpload(mockRequest);

      expect(result).toMatchObject({
        userId: mockRequest.userId,
        fileName: mockRequest.fileName,
        fileType: mockRequest.fileType,
        fileSize: mockRequest.fileSize,
        s3Key: mockRequest.s3Key,
        uploadStatus: UploadStatus.PENDING,
        uploadUrl: mockRequest.uploadUrl,
      });

      expect(result.fileId).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(result.expiresAt).toBeDefined();
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should handle ConditionalCheckFailedException', async () => {
      const mockRequest = {
        userId: 'user-123',
        fileName: 'test-video.mp4',
        fileType: 'video/mp4',
        fileSize: 1024000,
        s3Key: 'uploads/user-123/test-video.mp4',
        uploadUrl: 'https://presigned-url.com',
      };

      const error = new Error('Conditional check failed');
      error.name = 'ConditionalCheckFailedException';
      mockSend.mockRejectedValueOnce(error);

      await expect(repository.createFileUpload(mockRequest)).rejects.toThrow('Já existe um registro com este ID.');
    });

    it('should handle other DynamoDB errors', async () => {
      const mockRequest = {
        userId: 'user-123',
        fileName: 'test-video.mp4',
        fileType: 'video/mp4',
        fileSize: 1024000,
        s3Key: 'uploads/user-123/test-video.mp4',
        uploadUrl: 'https://presigned-url.com',
      };

      const error = new Error('DynamoDB service unavailable');
      mockSend.mockRejectedValueOnce(error);

      await expect(repository.createFileUpload(mockRequest)).rejects.toThrow('DynamoDB service unavailable');
    });
  });

  describe('updateUploadStatus', () => {
    it('should update upload status', async () => {
      const fileId = 'file-123';
      const newStatus = UploadStatus.UPLOADED;

      // Mock successful DynamoDB response
      mockSend.mockResolvedValueOnce({});

      // Não deve gerar erro
      await expect(repository.updateUploadStatus(fileId, newStatus)).resolves.not.toThrow();
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('getFileUpload', () => {
    it('should return null when file not found', async () => {
      // Mock DynamoDB response when item not found
      mockSend.mockResolvedValueOnce({ Item: undefined });

      const result = await repository.getFileUpload('non-existent-id');
      expect(result).toBeNull();
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should return file when found', async () => {
      const mockFile = {
        fileId: 'file-123',
        userId: 'user-123',
        fileName: 'test.mp4',
        fileType: 'video/mp4',
        fileSize: 1024,
        s3Key: 'uploads/user-123/test.mp4',
        uploadStatus: UploadStatus.UPLOADED,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
        expiresAt: 1672531200,
      };

      mockSend.mockResolvedValueOnce({ Item: mockFile });

      const result = await repository.getFileUpload('file-123');
      expect(result).toEqual(mockFile);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('listUserUploads', () => {
    it('should return empty list when user has no uploads', async () => {
      // Mock DynamoDB response when no items found
      mockSend.mockResolvedValueOnce({ Items: undefined });

      const result = await repository.listUserUploads('user-without-files');
      expect(result).toEqual([]);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should return list of user uploads', async () => {
      const mockFiles = [
        {
          fileId: 'file-1',
          userId: 'user-123',
          fileName: 'video1.mp4',
          uploadStatus: UploadStatus.UPLOADED,
        },
        {
          fileId: 'file-2',
          userId: 'user-123',
          fileName: 'video2.mp4',
          uploadStatus: UploadStatus.PENDING,
        },
      ];

      mockSend.mockResolvedValueOnce({ Items: mockFiles });

      const result = await repository.listUserUploads('user-123');
      expect(result).toEqual(mockFiles);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should use custom limit', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });

      await repository.listUserUploads('user-123', 10);

      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeExpiredUploadUrl', () => {
    it('should remove upload URL from record', async () => {
      mockSend.mockResolvedValueOnce({});

      await repository.removeExpiredUploadUrl('file-123');

      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('findByS3Key', () => {
    it('should return null when no file found with S3 key', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });

      const result = await repository.findByS3Key('non-existent-key');
      expect(result).toBeNull();
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should return file when found by S3 key', async () => {
      const mockFile = {
        fileId: 'file-123',
        s3Key: 'uploads/user-123/test.mp4',
        fileName: 'test.mp4',
      };

      mockSend.mockResolvedValueOnce({ Items: [mockFile] });

      const result = await repository.findByS3Key('uploads/user-123/test.mp4');
      expect(result).toEqual(mockFile);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });
});
