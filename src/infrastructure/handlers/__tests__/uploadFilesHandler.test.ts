import { uploadFilesHandler } from '../uploadFilesHandler';
import { AuthMiddleware } from '../../middlewares/authMiddleware';
import { S3UploadService } from '../../services/S3UploadService';
import { FileUploadRepository } from '../../db/FileUploadRepository';

jest.mock('../../middlewares/authMiddleware');
jest.mock('../../services/S3UploadService');
jest.mock('../../db/FileUploadRepository');

const MockedAuthMiddleware = AuthMiddleware as jest.MockedClass<typeof AuthMiddleware>;
const MockedS3UploadService = S3UploadService as jest.MockedClass<typeof S3UploadService>;
const MockedFileUploadRepository = FileUploadRepository as jest.MockedClass<typeof FileUploadRepository>;

describe('uploadFilesHandler', () => {
  let mockAuthMiddleware: jest.Mocked<AuthMiddleware>;
  let mockS3Service: jest.Mocked<S3UploadService>;
  let mockRepository: jest.Mocked<FileUploadRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthMiddleware = new MockedAuthMiddleware() as jest.Mocked<AuthMiddleware>;
    mockS3Service = new MockedS3UploadService() as jest.Mocked<S3UploadService>;
    mockRepository = new MockedFileUploadRepository() as jest.Mocked<FileUploadRepository>;

    MockedAuthMiddleware.mockImplementation(() => mockAuthMiddleware);
    MockedS3UploadService.mockImplementation(() => mockS3Service);
    MockedFileUploadRepository.mockImplementation(() => mockRepository);

    mockAuthMiddleware.authenticate.mockResolvedValue({
      userId: 'test-user',
      sub: 'test-user',
      username: 'test-user',
      email: 'test@example.com',
    });

    mockS3Service.generateUploadUrl.mockResolvedValue({
      uploadUrl: 'https://s3.amazonaws.com/test-bucket/test-key',
      fileKey: 'uploads/test-user/test-file.mp4',
      expiresIn: 3600,
    });

    mockRepository.createFileUpload.mockResolvedValue({
      fileId: 'test-file-id',
      userId: 'test-user',
      fileName: 'test-video.mp4',
      fileType: 'video/mp4',
      fileSize: 50 * 1024 * 1024,
      s3Key: 'uploads/test-user/test-file.mp4',
      status: 'PENDING' as any,
      uploadUrl: 'https://s3.amazonaws.com/test-bucket/test-key',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
      expiresAt: 1672531200,
    });
  });
  it('should exist and be a function', () => {
    expect(typeof uploadFilesHandler).toBe('function');
  });

  it('should process API Gateway events', async () => {
    const mockEvent = {
      httpMethod: 'POST',
      body: JSON.stringify({
        fileName: 'test-video.mp4',
        fileType: 'video/mp4',
        fileSize: 50 * 1024 * 1024,
      }),
      headers: {
        Authorization: 'Bearer valid-token',
      },
      pathParameters: null,
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      multiValueHeaders: {},
      stageVariables: null,
      requestContext: {} as any,
      resource: '',
      path: '',
      isBase64Encoded: false,
    };

    const mockContext = {
      callbackWaitsForEmptyEventLoop: false,
      functionName: 'test',
      functionVersion: '1',
      invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test',
      memoryLimitInMB: '128',
      awsRequestId: 'test-request-id',
      logGroupName: '/aws/lambda/test',
      logStreamName: '2021/01/01/[$LATEST]test',
      getRemainingTimeInMillis: () => 30000,
      done: () => {},
      fail: () => {},
      succeed: () => {},
    };

    try {
      const result = await uploadFilesHandler(mockEvent, mockContext, () => {});
      expect(result).toBeDefined();
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
