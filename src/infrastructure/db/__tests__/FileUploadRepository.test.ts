import { FileUploadRepository } from '../FileUploadRepository';
import { UploadStatus } from '../../../domain/FileUploadRecord';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

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
    repository = new FileUploadRepository();
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
  });

  describe('listUserUploads', () => {
    it('should return empty list when user has no uploads', async () => {
      // Mock DynamoDB response when no items found
      mockSend.mockResolvedValueOnce({ Items: undefined });

      const result = await repository.listUserUploads('user-without-files');
      expect(result).toEqual([]);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });
});
