import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';

export interface SnsEventMessage {
  eventType: string;
  payload: any;
}

export class SnsPublisher {
  private sns: SNSClient;
  private topicArn: string;

  constructor() {
    this.sns = new SNSClient({ region: process.env.AWS_REGION! });
    this.topicArn = process.env.SNS_TOPIC_ARN! ?? `arn:aws:sns:us-west-2:381492156649:sns-video-manager-api`;
  }

  async publish(message: SnsEventMessage): Promise<void> {
    const params = {
      TopicArn: this.topicArn,
      Message: JSON.stringify({
        eventType: message.eventType,
        payload: message.payload,
        timestamp: new Date().toISOString(),
      }),
      MessageAttributes: {
        eventType: {
          DataType: 'String',
          StringValue: message.eventType,
        },
      },
    };

    try {
      await this.sns.send(new PublishCommand(params));
    } catch (error) {
      console.error('Error publishing SNS message:', error);
      throw new Error('Failed to publish SNS message. Please try again.');
    }
  }
}
