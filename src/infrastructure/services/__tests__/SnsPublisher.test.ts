import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { SnsEventMessage, SnsPublisher } from '../SnsPublisher';

jest.mock('@aws-sdk/client-sns');

const mockSNSClient = SNSClient as jest.MockedClass<typeof SNSClient>;
const mockSend = jest.fn();

describe('SnsPublisher', () => {
  let snsPublisher: SnsPublisher;
  const mockTopicArn = 'arn:aws:sns:us-east-1:123456789012:test-topic';

  beforeEach(() => {
    jest.clearAllMocks();
    mockSNSClient.mockImplementation(
      () =>
        ({
          send: mockSend,
        }) as any,
    );

    process.env.AWS_REGION = 'us-east-1';
    process.env.SNS_TOPIC_ARN = mockTopicArn;
  });

  afterEach(() => {
    delete process.env.AWS_REGION;
    delete process.env.SNS_TOPIC_ARN;
  });

  describe('constructor', () => {
    it('should create instance with environment variables', () => {
      snsPublisher = new SnsPublisher();
      expect(mockSNSClient).toHaveBeenCalledWith({ region: 'us-east-1' });
    });

    it('should use default topic ARN when environment variable is not set', () => {
      delete process.env.SNS_TOPIC_ARN;

      snsPublisher = new SnsPublisher();
      expect(mockSNSClient).toHaveBeenCalledWith({ region: 'us-east-1' });

      process.env.SNS_TOPIC_ARN = mockTopicArn;
    });
  });

  describe('publish', () => {
    beforeEach(() => {
      snsPublisher = new SnsPublisher();
    });

    it('should publish message successfully', async () => {
      const testMessage: SnsEventMessage = {
        eventType: 'FILE_UPLOADED',
        payload: { userId: 'user123', fileKey: 'uploads/test.mp4' },
      };

      mockSend.mockResolvedValueOnce({});

      await snsPublisher.publish(testMessage);

      expect(mockSend).toHaveBeenCalledWith(expect.any(PublishCommand));
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should handle publish errors', async () => {
      const testMessage: SnsEventMessage = {
        eventType: 'FILE_UPLOADED',
        payload: { userId: 'user123', fileKey: 'uploads/test.mp4' },
      };

      const mockError = new Error('SNS Error');
      mockSend.mockRejectedValueOnce(mockError);

      await expect(snsPublisher.publish(testMessage)).rejects.toThrow('Failed to publish SNS message. Please try again.');

      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should create PublishCommand with correct topic ARN', async () => {
      const testMessage: SnsEventMessage = {
        eventType: 'FILE_PROCESSED',
        payload: { status: 'completed' },
      };

      mockSend.mockResolvedValueOnce({});

      await snsPublisher.publish(testMessage);

      expect(mockSend).toHaveBeenCalledWith(expect.any(PublishCommand));
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });
});
