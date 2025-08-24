variable "AWS_REGION" {
  type    = string
  default = "us-west-2"
}

variable "AWS_ACCOUNT_ID" {
  type    = string
  default = "548226336065"
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
