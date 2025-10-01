import { sqsEventHandler } from '../sqsEventHandler';
import { FileUploadRepository } from '../../db/FileUploadRepository';
import { FileUploadRecordStatus } from '../../../domain/FileUploadRecord';
import { EmailService } from '../../services/EmailService';
import { SQSEvent, SQSRecord, Context } from 'aws-lambda';

jest.mock('../../db/FileUploadRepository');
const MockedFileUploadRepository = FileUploadRepository as jest.MockedClass<typeof FileUploadRepository>;

jest.mock('../../services/EmailService');
const MockedEmailService = EmailService as jest.MockedClass<typeof EmailService>;

describe('sqsEventHandler', () => {
  let mockRepository: jest.Mocked<FileUploadRepository>;
  let mockEmailService: jest.Mocked<EmailService>;
  const mockContext: Context = {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'test-function',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-west-2:123456789012:function:test-function',
    memoryLimitInMB: '128',
    awsRequestId: 'test-request-id',
    logGroupName: '/aws/lambda/test-function',
    logStreamName: '2023/01/01/[$LATEST]abcdef123456',
    getRemainingTimeInMillis: () => 30000,
    done: jest.fn(),
    fail: jest.fn(),
    succeed: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepository = new MockedFileUploadRepository() as jest.Mocked<FileUploadRepository>;
    MockedFileUploadRepository.mockImplementation(() => mockRepository);

    mockEmailService = new MockedEmailService() as jest.Mocked<EmailService>;
    MockedEmailService.mockImplementation(() => mockEmailService);

    mockRepository.getFileUpload = jest.fn();
    mockRepository.updateUploadStatus = jest.fn();
    mockRepository.updateProcessedFileS3Key = jest.fn();
    mockEmailService.sendVideoProcessingFailureEmail = jest.fn();
  });

  const createSQSEvent = (eventType: string, payload: any): SQSEvent => {
    const snsMessage = JSON.stringify({ eventType, payload });
    const sqsBody = JSON.stringify({
      Type: 'Notification',
      MessageId: 'sns-message-id',
      TopicArn: 'arn:aws:sns:us-west-2:123456789012:test-topic',
      Message: snsMessage,
      Timestamp: '2023-01-01T00:00:00.000Z',
      SignatureVersion: '1',
      Signature: 'test-signature',
      SigningCertURL: 'https://test.com',
      UnsubscribeURL: 'https://test.com',
    });

    const record: SQSRecord = {
      messageId: 'test-message-id',
      receiptHandle: 'test-receipt-handle',
      body: sqsBody,
      attributes: {
        ApproximateReceiveCount: '1',
        SentTimestamp: '1234567890',
        SenderId: 'test-sender',
        ApproximateFirstReceiveTimestamp: '1234567890',
      },
      messageAttributes: {},
      md5OfBody: 'test-md5',
      eventSource: 'aws:sqs',
      eventSourceARN: 'arn:aws:sqs:us-west-2:123456789012:test-queue',
      awsRegion: 'us-west-2',
    };

    return {
      Records: [record],
    };
  };

  describe('PROCESS_VIDEO_COMPLETED event', () => {
    it('should update status to COMPLETED when the event is processed successfully', async () => {
      const fileId = 'test-file-id';
      const payload = {
        fileId,
        fileName: 'test.mp4',
        userId: 'user-123',
        s3Key: 'videos/test.mp4',
      };

      const mockFileRecord = {
        fileId,
        userId: 'user-123',
        fileName: 'test.mp4',
        status: FileUploadRecordStatus.PROCESSING,
      };

      mockRepository.getFileUpload.mockResolvedValue(mockFileRecord as any);
      mockRepository.updateUploadStatus.mockResolvedValue();

      const event = createSQSEvent('PROCESS_VIDEO_COMPLETED', payload);

      await sqsEventHandler(event, mockContext, jest.fn());

      expect(mockRepository.getFileUpload).toHaveBeenCalledWith(fileId);
      expect(mockRepository.updateUploadStatus).toHaveBeenCalledWith(fileId, FileUploadRecordStatus.COMPLETED);
    });

    it('should update processedFileS3Key when provided in the payload', async () => {
      const fileId = 'test-file-id';
      const processedFileS3Key = 'processed/test.mp4';
      const payload = {
        fileId,
        processedFileS3Key,
      };

      const mockFileRecord = {
        fileId,
        status: FileUploadRecordStatus.PROCESSING,
      };

      mockRepository.getFileUpload.mockResolvedValue(mockFileRecord as any);
      mockRepository.updateUploadStatus.mockResolvedValue();
      mockRepository.updateProcessedFileS3Key.mockResolvedValue();

      const event = createSQSEvent('PROCESS_VIDEO_COMPLETED', payload);

      await sqsEventHandler(event, mockContext, jest.fn());

      expect(mockRepository.updateUploadStatus).toHaveBeenCalledWith(fileId, FileUploadRecordStatus.COMPLETED);
      expect(mockRepository.updateProcessedFileS3Key).toHaveBeenCalledWith(fileId, processedFileS3Key);
    });
  });

  describe('PROCESS_VIDEO_FAILURE event', () => {
    it('should update status to FAILED and send failure notification email', async () => {
      const fileId = 'test-file-id';
      const payload = {
        fileId,
        fileName: 'test.mp4',
        userId: 'user@example.com',
        s3Key: 'videos/test.mp4',
        status: 'FAILED' as const,
        error: 'Processing failed',
      };

      const mockFileRecord = {
        fileId,
        status: FileUploadRecordStatus.PROCESSING,
      };

      mockRepository.getFileUpload.mockResolvedValue(mockFileRecord as any);
      mockRepository.updateUploadStatus.mockResolvedValue();
      mockEmailService.sendVideoProcessingFailureEmail.mockResolvedValue();

      const event = createSQSEvent('PROCESS_VIDEO_FAILURE', payload);

      await sqsEventHandler(event, mockContext, jest.fn());

      expect(mockRepository.getFileUpload).toHaveBeenCalledWith(fileId);
      expect(mockRepository.updateUploadStatus).toHaveBeenCalledWith(fileId, FileUploadRecordStatus.FAILED);
      expect(mockEmailService.sendVideoProcessingFailureEmail).toHaveBeenCalledWith('user@example.com', 'test.mp4');
    });

    it('should continue processing even if email sending fails', async () => {
      const fileId = 'test-file-id';
      const payload = {
        fileId,
        fileName: 'test.mp4',
        userId: 'user@example.com',
        s3Key: 'videos/test.mp4',
        status: 'FAILED' as const,
        error: 'Processing failed',
      };

      const mockFileRecord = {
        fileId,
        status: FileUploadRecordStatus.PROCESSING,
      };

      mockRepository.getFileUpload.mockResolvedValue(mockFileRecord as any);
      mockRepository.updateUploadStatus.mockResolvedValue();
      mockEmailService.sendVideoProcessingFailureEmail.mockRejectedValue(new Error('Email service error'));

      const event = createSQSEvent('PROCESS_VIDEO_FAILURE', payload);

      await expect(sqsEventHandler(event, mockContext, jest.fn())).resolves.toBeUndefined();

      expect(mockRepository.updateUploadStatus).toHaveBeenCalledWith(fileId, FileUploadRecordStatus.FAILED);
      expect(mockEmailService.sendVideoProcessingFailureEmail).toHaveBeenCalled();
    });
  });

  describe('Tratamento de erros', () => {
    it('should continue processing when a record is not valid', async () => {
      const event = createSQSEvent('INVALID_EVENT', {});
      await expect(sqsEventHandler(event, mockContext, jest.fn())).resolves.toBeUndefined();
    });

    it('should continue processing when fileId is not present', async () => {
      const payload = {
        fileName: 'test.mp4',
      };

      const event = createSQSEvent('PROCESS_VIDEO_COMPLETED', payload);

      await expect(sqsEventHandler(event, mockContext, jest.fn())).resolves.toBeUndefined();
      expect(mockRepository.getFileUpload).not.toHaveBeenCalled();
    });

    it('should continue processing when a record is not found', async () => {
      const fileId = 'non-existent-file-id';
      const payload = { fileId };

      mockRepository.getFileUpload.mockResolvedValue(null);

      const event = createSQSEvent('PROCESS_VIDEO_COMPLETED', payload);

      await expect(sqsEventHandler(event, mockContext, jest.fn())).resolves.toBeUndefined();
      expect(mockRepository.getFileUpload).toHaveBeenCalledWith(fileId);
      expect(mockRepository.updateUploadStatus).not.toHaveBeenCalled();
    });

    it('should continue processing when an error occurs in DynamoDB', async () => {
      const fileId = 'test-file-id';
      const payload = { fileId };

      const mockFileRecord = {
        fileId,
        status: FileUploadRecordStatus.PROCESSING,
      };

      mockRepository.getFileUpload.mockResolvedValue(mockFileRecord as any);
      mockRepository.updateUploadStatus.mockRejectedValue(new Error('DynamoDB error'));

      const event = createSQSEvent('PROCESS_VIDEO_COMPLETED', payload);

      await expect(sqsEventHandler(event, mockContext, jest.fn())).resolves.toBeUndefined();
    });

    it('should process multiple records correctly', async () => {
      const fileId1 = 'file-1';
      const fileId2 = 'file-2';

      const snsMessage1 = JSON.stringify({
        eventType: 'PROCESS_VIDEO_COMPLETED',
        payload: { fileId: fileId1 },
      });
      const sqsBody1 = JSON.stringify({
        Type: 'Notification',
        MessageId: 'sns-message-id-1',
        TopicArn: 'arn:aws:sns:us-west-2:123456789012:test-topic',
        Message: snsMessage1,
        Timestamp: '2023-01-01T00:00:00.000Z',
        SignatureVersion: '1',
        Signature: 'test-signature',
        SigningCertURL: 'https://test.com',
        UnsubscribeURL: 'https://test.com',
      });

      const snsMessage2 = JSON.stringify({
        eventType: 'PROCESS_VIDEO_FAILURE',
        payload: {
          fileId: fileId2,
          fileName: 'test2.mp4',
          userId: 'user-123',
          s3Key: 'videos/test2.mp4',
          status: 'FAILED',
          error: 'Processing failed',
        },
      });
      const sqsBody2 = JSON.stringify({
        Type: 'Notification',
        MessageId: 'sns-message-id-2',
        TopicArn: 'arn:aws:sns:us-west-2:123456789012:test-topic',
        Message: snsMessage2,
        Timestamp: '2023-01-01T00:00:00.000Z',
        SignatureVersion: '1',
        Signature: 'test-signature',
        SigningCertURL: 'https://test.com',
        UnsubscribeURL: 'https://test.com',
      });

      const record1: SQSRecord = {
        messageId: 'message-1',
        receiptHandle: 'handle-1',
        body: sqsBody1,
        attributes: {
          ApproximateReceiveCount: '1',
          SentTimestamp: '1234567890',
          SenderId: 'test-sender',
          ApproximateFirstReceiveTimestamp: '1234567890',
        },
        messageAttributes: {},
        md5OfBody: 'test-md5-1',
        eventSource: 'aws:sqs',
        eventSourceARN: 'arn:aws:sqs:us-west-2:123456789012:test-queue',
        awsRegion: 'us-west-2',
      };

      const record2: SQSRecord = {
        messageId: 'message-2',
        receiptHandle: 'handle-2',
        body: sqsBody2,
        attributes: {
          ApproximateReceiveCount: '1',
          SentTimestamp: '1234567890',
          SenderId: 'test-sender',
          ApproximateFirstReceiveTimestamp: '1234567890',
        },
        messageAttributes: {},
        md5OfBody: 'test-md5-2',
        eventSource: 'aws:sqs',
        eventSourceARN: 'arn:aws:sqs:us-west-2:123456789012:test-queue',
        awsRegion: 'us-west-2',
      };

      const event: SQSEvent = {
        Records: [record1, record2],
      };

      const mockFileRecord1 = { fileId: fileId1, status: FileUploadRecordStatus.PROCESSING };
      const mockFileRecord2 = { fileId: fileId2, status: FileUploadRecordStatus.PROCESSING };

      mockRepository.getFileUpload
        .mockResolvedValueOnce(mockFileRecord1 as any)
        .mockResolvedValueOnce(mockFileRecord2 as any);
      mockRepository.updateUploadStatus.mockResolvedValue();

      await sqsEventHandler(event, mockContext, jest.fn());

      expect(mockRepository.getFileUpload).toHaveBeenCalledTimes(2);
      expect(mockRepository.updateUploadStatus).toHaveBeenNthCalledWith(1, fileId1, FileUploadRecordStatus.COMPLETED);
      expect(mockRepository.updateUploadStatus).toHaveBeenNthCalledWith(2, fileId2, FileUploadRecordStatus.FAILED);
    });
  });
});
