variable "AWS_REGION" {
  type    = string
  default = "us-west-2"
}

variable "AWS_ACCOUNT_ID" {
  type    = string
  default = "339713125069"
}

variable "S3_BUCKET_NAME" {
  type    = string
  default = "soat10-video-manager-bucket"
}

variable "DYNAMODB_TABLE_NAME" {
  type    = string
  default = "file_uploads"
}

data "aws_ssm_parameter" "cognito_user_pool_id" {
  name = "/soat10/authorization-api/cognito_user_pool_id"
}

data "aws_ssm_parameter" "cognito_client_id" {
  name = "/soat10/authorization-api/cognito_client_id"
}
