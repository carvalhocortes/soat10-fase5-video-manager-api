resource "aws_ssm_parameter" "auth_api_url" {
  name        = "/soat10/video-manager-api/auth_api_url"
  description = "Base URL of the Video Manager API"
  type        = "String"
  value       = aws_apigatewayv2_api.http_api.api_endpoint
}
