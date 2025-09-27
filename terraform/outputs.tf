output "AUTH_API_URL" {
  description = "Base URL of the HTTP API"
  value       = aws_apigatewayv2_api.http_api.api_endpoint
}

output "S3_BUCKET_NAME" {
  description = "Name of the S3 bucket for video storage"
  value       = aws_s3_bucket.video_storage.id
}

output "S3_BUCKET_ARN" {
  description = "ARN of the S3 bucket for video storage"
  value       = aws_s3_bucket.video_storage.arn
}

output "S3_EVENT_HANDLER_FUNCTION_NAME" {
  description = "Name of the S3 event handler Lambda function"
  value       = aws_lambda_function.s3_event_handler.function_name
}
