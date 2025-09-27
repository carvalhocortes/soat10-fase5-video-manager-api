import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import { downloadFilesHandler } from '../downloadFilesHandler';
import { FileUploadRepository } from '../../db/FileUploadRepository';
import { S3UploadService } from '../../services/S3UploadService';
import { AuthMiddleware } from '../../middlewares/authMiddleware';
import { UploadStatus } from '../../../domain/FileUploadRecord';

jest.mock('../../db/FileUploadRepository');
jest.mock('../../services/S3UploadService');
jest.mock('../../middlewares/authMiddleware');

const MockedFileUploadRepository = FileUploadRepository as jest.MockedClass<typeof FileUploadRepository>;
const MockedS3UploadService = S3UploadService as jest.MockedClass<typeof S3UploadService>;
const MockedAuthMiddleware = AuthMiddleware as jest.MockedClass<typeof AuthMiddleware>;

describe('downloadFilesHandler', () => {
  let mockRepository: jest.Mocked<FileUploadRepository>;
  let mockS3Service: jest.Mocked<S3UploadService>;
  let mockAuthMiddleware: jest.Mocked<AuthMiddleware>;

  beforeAll(() => {
    process.env.COGNITO_USER_POOL_ID = 'test-user-pool-id';
    process.env.COGNITO_CLIENT_ID = 'test-client-id';
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepository = new MockedFileUploadRepository() as jest.Mocked<FileUploadRepository>;
    mockS3Service = new MockedS3UploadService() as jest.Mocked<S3UploadService>;
    mockAuthMiddleware = new MockedAuthMiddleware() as jest.Mocked<AuthMiddleware>;

    MockedFileUploadRepository.mockImplementation(() => mockRepository);
    MockedS3UploadService.mockImplementation(() => mockS3Service);
    MockedAuthMiddleware.mockImplementation(() => mockAuthMiddleware);

    mockAuthMiddleware.authenticate.mockResolvedValue({
      userId: 'test-user',
      sub: 'test-user',
      email: 'test@example.com',
    });
  });

  const createMockEvent = (fileId?: string): APIGatewayProxyEvent => ({
    httpMethod: 'GET',
    path: `/download/${fileId}`,
    pathParameters: fileId ? { fileId } : null,
    queryStringParameters: null,
    headers: {
      Authorization: 'Bearer valid-token',
    },
    body: null,
    isBase64Encoded: false,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: '',
  });

  const mockContext: Context = {} as Context;

  const mockFileRecord = {
    fileId: 'test-file-id',
    userId: 'test-user',
    fileName: 'test-video.mp4',
    fileType: 'video/mp4',
    fileSize: 1000000,
    s3Key: 'uploads/test-user/original-file.mp4',
    processedFileS3Key: 'processed/test-user/processed-file.mp4',
    uploadStatus: UploadStatus.COMPLETED,
    uploadUrl: 'https://example.com/upload',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    expiresAt: 1672531200,
  };

  it('should generate download URL for processed file successfully', async () => {
    const event = createMockEvent('test-file-id');
    const mockDownloadResponse = {
      downloadUrl: 'https://s3.amazonaws.com/bucket/processed/test-user/processed-file.mp4',
      fileName: 'test-video.mp4',
      expiresIn: 3600,
    };

    mockRepository.getFileUpload.mockResolvedValue(mockFileRecord);
    mockS3Service.generateDownloadUrl.mockResolvedValue(mockDownloadResponse);

    const result = (await downloadFilesHandler(event, mockContext, jest.fn())) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toMatchObject({
      fileId: 'test-file-id',
      fileName: 'test-video.mp4',
      downloadUrl: mockDownloadResponse.downloadUrl,
      expiresIn: 3600,
      uploadStatus: UploadStatus.COMPLETED,
    });
    expect(mockRepository.getFileUpload).toHaveBeenCalledWith('test-file-id');
    expect(mockS3Service.generateDownloadUrl).toHaveBeenCalledWith(
      'processed/test-user/processed-file.mp4',
      'test-video.mp4',
    );
  });

  it('should return error 400 when fileId is not provided', async () => {
    const event = createMockEvent();

    const result = (await downloadFilesHandler(event, mockContext, jest.fn())) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toBe('FileId is required');
  });

  it('should return error 404 when file does not exist', async () => {
    const event = createMockEvent('non-existent-file');

    mockRepository.getFileUpload.mockResolvedValue(null);

    const result = (await downloadFilesHandler(event, mockContext, jest.fn())) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body).message).toBe('File not found');
  });

  it('should return error 403 when user is not owner of the file', async () => {
    const event = createMockEvent('test-file-id');
    const fileRecordWithDifferentUser = { ...mockFileRecord, userId: 'other-user' };

    mockRepository.getFileUpload.mockResolvedValue(fileRecordWithDifferentUser);

    const result = (await downloadFilesHandler(event, mockContext, jest.fn())) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(403);
    expect(JSON.parse(result.body).message).toBe('You do not have permission to download this file');
  });

  it('should return error 400 when file is not in COMPLETED status', async () => {
    const event = createMockEvent('test-file-id');
    const pendingFileRecord = { ...mockFileRecord, uploadStatus: UploadStatus.PROCESSING };

    mockRepository.getFileUpload.mockResolvedValue(pendingFileRecord);

    const result = (await downloadFilesHandler(event, mockContext, jest.fn())) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toBe('File is not available for download. Current status: PROCESSING');
  });

  it('should return error 400 when processedFileS3Key is not found', async () => {
    const event = createMockEvent('test-file-id');
    const fileRecordWithoutProcessedKey = { ...mockFileRecord, processedFileS3Key: undefined };

    mockRepository.getFileUpload.mockResolvedValue(fileRecordWithoutProcessedKey);

    const result = (await downloadFilesHandler(event, mockContext, jest.fn())) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toBe('Processed file not found in the system');
  });

  it('should handle repository error', async () => {
    const event = createMockEvent('test-file-id');

    mockRepository.getFileUpload.mockRejectedValue(new Error('Database error'));

    const result = (await downloadFilesHandler(event, mockContext, jest.fn())) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(500);
  });
});
