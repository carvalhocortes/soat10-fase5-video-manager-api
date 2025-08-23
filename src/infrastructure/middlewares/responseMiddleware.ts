export class ResponseMiddleware {
  static handle(data: any, statusCode: number = 200) {
    return {
      statusCode,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
  }
}
