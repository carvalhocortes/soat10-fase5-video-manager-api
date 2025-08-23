resource "aws_lambda_function" "upload_files" {
  function_name    = "upload-files"
  filename         = "../lambda.zip"
  source_code_hash = filebase64sha256("../lambda.zip")
  handler          = "index.uploadFilesHandler"
  runtime          = "nodejs22.x"
  role             = "arn:aws:iam::${var.aws_account_id}:role/LabRole"
  timeout          = 10

  environment {
    variables = {
      COGNITO_USER_POOL_ID = var.COGNITO_USER_POOL_ID
      COGNITO_CLIENT_ID    = var.COGNITO_CLIENT_ID
    }
  }
}

resource "aws_lambda_function" "download_files" {
  function_name    = "download-files"
  filename         = "../lambda.zip"
  source_code_hash = filebase64sha256("../lambda.zip")
  handler          = "index.downloadFilesHandler"
  runtime          = "nodejs22.x"
  role             = "arn:aws:iam::${var.aws_account_id}:role/LabRole"
  timeout          = 10

  environment {
    variables = {
      COGNITO_USER_POOL_ID = var.COGNITO_USER_POOL_ID
      COGNITO_CLIENT_ID    = var.COGNITO_CLIENT_ID
    }
  }
}

resource "aws_lambda_function" "list_files" {
  function_name    = "list-files"
  filename         = "../lambda.zip"
  source_code_hash = filebase64sha256("../lambda.zip")
  handler          = "index.listFilesHandler"
  runtime          = "nodejs22.x"
  role             = "arn:aws:iam::${var.aws_account_id}:role/LabRole"
  timeout          = 10

  environment {
    variables = {
      COGNITO_USER_POOL_ID = var.COGNITO_USER_POOL_ID
      COGNITO_CLIENT_ID    = var.COGNITO_CLIENT_ID
    }
  }
}
