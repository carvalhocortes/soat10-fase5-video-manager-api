import { Context, S3Event } from 'aws-lambda';
import { UploadStatus } from '../../../domain/FileUploadRecord';
import { FileUploadRepository } from '../../db/FileUploadRepository';
import { s3EventHandler } from '../s3EventHandler';

jest.mock('../../db/FileUploadRepository');

describe('s3EventHandler', () => {
  let mockRepository: jest.Mocked<FileUploadRepository>;
  let consoleSpy: jest.SpyInstance;
  let mockContext: Context;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepository = new FileUploadRepository() as jest.Mocked<FileUploadRepository>;
    (FileUploadRepository as jest.Mock).mockImplementation(() => mockRepository);
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    mockContext = {
      callbackWaitsForEmptyEventLoop: false,
      functionName: 'test-function',
      functionVersion: '1',
      invokedFunctionArn: 'arn:aws:lambda:us-west-2:123456789012:function:test-function',
      memoryLimitInMB: '128',
      awsRequestId: 'test-request-id',
      logGroupName: '/aws/lambda/test-function',
      logStreamName: '2023/01/01/[$LATEST]test-stream',
      getRemainingTimeInMillis: () => 30000,
      done: jest.fn(),
      fail: jest.fn(),
      succeed: jest.fn(),
    };
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  const createS3Event = (eventName: string, objectKey: string, bucketName = 'test-bucket'): S3Event => ({
    Records: [
      {
        eventVersion: '2.1',
        eventSource: 'aws:s3',
        awsRegion: 'us-west-2',
        eventTime: '2023-01-01T00:00:00.000Z',
        eventName,
        userIdentity: {
          principalId: 'test-principal',
        },
        requestParameters: {
          sourceIPAddress: '127.0.0.1',
        },
        responseElements: {
          'x-amz-request-id': 'test-request-id',
          'x-amz-id-2': 'test-id-2',
        },
        s3: {
          s3SchemaVersion: '1.0',
          configurationId: 'test-config',
          bucket: {
            name: bucketName,
            ownerIdentity: {
              principalId: 'test-principal',
            },
            arn: `arn:aws:s3:::${bucketName}`,
          },
          object: {
            key: objectKey,
            size: 1024,
            eTag: 'test-etag',
            sequencer: 'test-sequencer',
          },
        },
      },
    ],
  });

  describe('ObjectCreated events', () => {
    it('should update file status to UPLOADED when file record exists', async () => {
      const mockFileRecord = {
        fileId: 'test-file-id',
        userId: 'test-user-id',
        fileName: 'test.mp4',
        fileType: 'video/mp4',
        fileSize: 1024,
        s3Key: 'test-file.mp4',
        uploadStatus: UploadStatus.PENDING,
        uploadUrl: 'https://test-url',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
        expiresAt: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
      };

      mockRepository.findByS3Key.mockResolvedValue(mockFileRecord);
      mockRepository.updateUploadStatus.mockResolvedValue();

      const event = createS3Event('ObjectCreated:Put', 'test-file.mp4');

      await s3EventHandler(event, mockContext, jest.fn());

      expect(mockRepository.findByS3Key).toHaveBeenCalledWith('test-file.mp4');
      expect(mockRepository.updateUploadStatus).toHaveBeenCalledWith('test-file-id', UploadStatus.UPLOADED);
      expect(console.log).toHaveBeenCalledWith('Updated file test-file-id status to UPLOADED');
    });

    it('should handle ObjectCreated event when file record does not exist', async () => {
      mockRepository.findByS3Key.mockResolvedValue(null);

      const event = createS3Event('ObjectCreated:Put', 'non-existent-file.mp4');

      await s3EventHandler(event, mockContext, jest.fn());

      expect(mockRepository.findByS3Key).toHaveBeenCalledWith('non-existent-file.mp4');
      expect(mockRepository.updateUploadStatus).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('File non-existent-file.mp4 uploaded successfully');
    });

    it('should decode URL-encoded object keys', async () => {
      mockRepository.findByS3Key.mockResolvedValue(null);

      const event = createS3Event('ObjectCreated:Put', 'test%20file%20with%20spaces.mp4');

      await s3EventHandler(event, mockContext, jest.fn());

      expect(mockRepository.findByS3Key).toHaveBeenCalledWith('test file with spaces.mp4');
    });

    it('should replace plus signs with spaces in object keys', async () => {
      mockRepository.findByS3Key.mockResolvedValue(null);

      const event = createS3Event('ObjectCreated:Put', 'test+file+with+plus.mp4');

      await s3EventHandler(event, mockContext, jest.fn());

      expect(mockRepository.findByS3Key).toHaveBeenCalledWith('test file with plus.mp4');
    });

    it('should handle ObjectCreated:Post events', async () => {
      mockRepository.findByS3Key.mockResolvedValue(null);

      const event = createS3Event('ObjectCreated:Post', 'test-file.mp4');

      await s3EventHandler(event, mockContext, jest.fn());

      expect(mockRepository.findByS3Key).toHaveBeenCalledWith('test-file.mp4');
      expect(console.log).toHaveBeenCalledWith('File test-file.mp4 uploaded successfully');
    });
  });

  describe('ObjectRemoved events', () => {
    it('should log when file is removed', async () => {
      const event = createS3Event('ObjectRemoved:Delete', 'deleted-file.mp4');

      await s3EventHandler(event, mockContext, jest.fn());

      expect(console.log).toHaveBeenCalledWith('File deleted-file.mp4 was removed');
      expect(mockRepository.findByS3Key).not.toHaveBeenCalled();
      expect(mockRepository.updateUploadStatus).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle repository errors gracefully', async () => {
      const error = new Error('Database connection failed');
      mockRepository.findByS3Key.mockRejectedValue(error);

      const event = createS3Event('ObjectCreated:Put', 'test-file.mp4');

      await s3EventHandler(event, mockContext, jest.fn());

      expect(console.error).toHaveBeenCalledWith('Error processing S3 event:', error);
    });

    it('should handle updateUploadStatus errors gracefully', async () => {
      const mockFileRecord = {
        fileId: 'test-file-id',
        userId: 'test-user-id',
        fileName: 'test.mp4',
        fileType: 'video/mp4',
        fileSize: 1024,
        s3Key: 'test-file.mp4',
        uploadStatus: UploadStatus.PENDING,
        uploadUrl: 'https://test-url',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
        expiresAt: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
      };

      mockRepository.findByS3Key.mockResolvedValue(mockFileRecord);
      const error = new Error('Update failed');
      mockRepository.updateUploadStatus.mockRejectedValue(error);

      const event = createS3Event('ObjectCreated:Put', 'test-file.mp4');

      await s3EventHandler(event, mockContext, jest.fn());

      expect(console.error).toHaveBeenCalledWith('Error processing S3 event:', error);
    });
  });

  describe('Multiple records', () => {
    it('should process multiple S3 records', async () => {
      mockRepository.findByS3Key.mockResolvedValue(null);

      const event: S3Event = {
        Records: [
          createS3Event('ObjectCreated:Put', 'file1.mp4').Records[0],
          createS3Event('ObjectCreated:Put', 'file2.mp4').Records[0],
          createS3Event('ObjectRemoved:Delete', 'file3.mp4').Records[0],
        ],
      };

      await s3EventHandler(event, mockContext, jest.fn());

      expect(mockRepository.findByS3Key).toHaveBeenCalledTimes(2);
      expect(mockRepository.findByS3Key).toHaveBeenCalledWith('file1.mp4');
      expect(mockRepository.findByS3Key).toHaveBeenCalledWith('file2.mp4');
      expect(console.log).toHaveBeenCalledWith('File file1.mp4 uploaded successfully');
      expect(console.log).toHaveBeenCalledWith('File file2.mp4 uploaded successfully');
      expect(console.log).toHaveBeenCalledWith('File file3.mp4 was removed');
    });
  });

  describe('Logging', () => {
    it('should log processing information', async () => {
      mockRepository.findByS3Key.mockResolvedValue(null);

      const event = createS3Event('ObjectCreated:Put', 'test-file.mp4', 'test-bucket');

      await s3EventHandler(event, mockContext, jest.fn());

      expect(console.log).toHaveBeenCalledWith(
        'Processing S3 event: ObjectCreated:Put for object: test-file.mp4 in bucket: test-bucket',
      );
    });
  });
});
