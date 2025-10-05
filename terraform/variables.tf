variable "AWS_REGION" {
  type    = string
  default = "us-west-2"
}

variable "AWS_ACCOUNT_ID" {
  type = string
}

variable "S3_BUCKET_NAME" {
  type    = string
  default = "soat10-video-manager-bucket-personal"
}

variable "DYNAMODB_TABLE_NAME" {
  type    = string
  default = "file-uploads"
}

data "aws_ssm_parameter" "cognito_user_pool_id" {
  name = "/soat10/authorization-api/cognito_user_pool_id"
}

data "aws_ssm_parameter" "cognito_client_id" {
  name = "/soat10/authorization-api/cognito_client_id"
}

data "aws_ssm_parameter" "video_sqs_id" {
  name = "/soat10/infra-video-manager/video_sqs_id"
}

data "aws_ssm_parameter" "video_sns_topic_arn" {
  name = "/soat10/infra-video-manager/video_sns_topic_arn"
}

data "aws_ssm_parameter" "video_bucket_name" {
  name = "/soat10/infra-video-manager/video_bucket_name"
}

data "aws_ssm_parameter" "video_bucket_arn" {
  name = "/soat10/infra-video-manager/video_bucket_arn"
}

data "aws_cognito_user_pool" "auth_pool" {
  user_pool_id = data.aws_ssm_parameter.cognito_user_pool_id.value
}

data "aws_dynamodb_table" "files" {
  name = var.DYNAMODB_TABLE_NAME
}
