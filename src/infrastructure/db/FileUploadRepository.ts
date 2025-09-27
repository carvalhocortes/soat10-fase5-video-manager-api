import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { FileUploadRecord, CreateFileUploadRequest, UploadStatus } from '../../domain/FileUploadRecord';
import { v4 as uuidv4 } from 'uuid';

export class FileUploadRepository {
  private readonly client: DynamoDBDocumentClient;
  private readonly tableName: string;

  constructor() {
    const dynamoClient = new DynamoDBClient({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        sessionToken: process.env.AWS_SESSION_TOKEN!,
      },
    });

    this.client = DynamoDBDocumentClient.from(dynamoClient);
    this.tableName = process.env.FILE_UPLOAD_TABLE_NAME!;
  }

  async createFileUpload(request: CreateFileUploadRequest): Promise<FileUploadRecord> {
    const fileId = uuidv4();
    const now = new Date().toISOString();

    const record: FileUploadRecord = {
      fileId,
      userId: request.userId,
      fileName: request.fileName,
      fileType: request.fileType,
      fileSize: request.fileSize,
      s3Key: request.s3Key,
      uploadStatus: UploadStatus.PENDING,
      uploadUrl: request.uploadUrl,
      createdAt: now,
      updatedAt: now,
      expiresAt: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    };

    try {
      await this.client.send(
        new PutCommand({
          TableName: this.tableName,
          Item: record,
          ConditionExpression: 'attribute_not_exists(fileId)',
        }),
      );
      return record;
    } catch (error: any) {
      console.error('Falha ao salvar no DynamoDB:', error);
      if (error.name === 'ConditionalCheckFailedException') {
        throw new Error('Já existe um registro com este ID.');
      }
      throw error;
    }
  }

  async getFileUpload(fileId: string): Promise<FileUploadRecord | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { fileId },
      }),
    );

    return (result.Item as FileUploadRecord) || null;
  }

  async updateUploadStatus(fileId: string, status: UploadStatus): Promise<void> {
    const now = new Date().toISOString();

    await this.client.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { fileId },
        UpdateExpression: 'SET uploadStatus = :status, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':status': status,
          ':updatedAt': now,
        },
        ConditionExpression: 'attribute_exists(fileId)',
      }),
    );
  }

  async listUserUploads(userId: string, limit = 50): Promise<FileUploadRecord[]> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'UserIdIndex',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
        Limit: limit,
        ScanIndexForward: false,
      }),
    );

    return (result.Items as FileUploadRecord[]) || [];
  }

  async removeExpiredUploadUrl(fileId: string): Promise<void> {
    const now = new Date().toISOString();

    await this.client.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { fileId },
        UpdateExpression: 'REMOVE uploadUrl SET updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':updatedAt': now,
        },
        ConditionExpression: 'attribute_exists(fileId)',
      }),
    );
  }

  async findByS3Key(s3Key: string): Promise<FileUploadRecord | null> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'S3KeyIndex',
        KeyConditionExpression: 's3Key = :s3Key',
        ExpressionAttributeValues: {
          ':s3Key': s3Key,
        },
        Limit: 1,
        ScanIndexForward: false,
      }),
    );

    const items = (result.Items as FileUploadRecord[]) || [];
    return items.length > 0 ? items[0] : null;
  }
}
