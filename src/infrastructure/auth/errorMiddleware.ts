export class ErrorMiddleware {
  static handle(err: any) {
    const statusCode = err?.statusCode || 500;
    return {
      statusCode,
      body: JSON.stringify({
        httpCode: statusCode,
        internalCode: err?.internalCode || 'INTERNAL_SERVER_ERROR',
        message: err?.message,
      }),
    };
  }
}
