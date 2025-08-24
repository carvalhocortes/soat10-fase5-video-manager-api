resource "aws_lambda_function" "upload_files" {
  function_name    = "upload-files"
  filename         = "../lambda.zip"
  source_code_hash = filebase64sha256("../lambda.zip")
  handler          = "index.uploadFilesHandler"
  runtime          = "nodejs22.x"
  role             = "arn:aws:iam::${var.AWS_ACCOUNT_ID}:role/LabRole"
  timeout          = 10

  environment {
    variables = {
      COGNITO_USER_POOL_ID = data.aws_ssm_parameter.cognito_user_pool_id.value
      COGNITO_CLIENT_ID    = data.aws_ssm_parameter.cognito_client_id.value
    }
  }
}

resource "aws_lambda_function" "download_files" {
  function_name    = "download-files"
  filename         = "../lambda.zip"
  source_code_hash = filebase64sha256("../lambda.zip")
  handler          = "index.downloadFilesHandler"
  runtime          = "nodejs22.x"
  role             = "arn:aws:iam::${var.AWS_ACCOUNT_ID}:role/LabRole"
  timeout          = 10

  environment {
    variables = {
      COGNITO_USER_POOL_ID = data.aws_ssm_parameter.cognito_user_pool_id.value
      COGNITO_CLIENT_ID    = data.aws_ssm_parameter.cognito_client_id.value
    }
  }
}

resource "aws_lambda_function" "list_files" {
  function_name    = "list-files"
  filename         = "../lambda.zip"
  source_code_hash = filebase64sha256("../lambda.zip")
  handler          = "index.listFilesHandler"
  runtime          = "nodejs22.x"
  role             = "arn:aws:iam::${var.AWS_ACCOUNT_ID}:role/LabRole"
  timeout          = 10

  environment {
    variables = {
      COGNITO_USER_POOL_ID = data.aws_ssm_parameter.cognito_user_pool_id.value
      COGNITO_CLIENT_ID    = data.aws_ssm_parameter.cognito_client_id.value
    }
  }
}
