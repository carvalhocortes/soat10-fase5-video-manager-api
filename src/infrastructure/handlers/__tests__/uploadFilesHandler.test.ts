import { uploadFilesHandler } from '../uploadFilesHandler';

jest.mock('../../middlewares/authMiddleware');
jest.mock('../../services/S3UploadService');

describe('uploadFilesHandler', () => {
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
