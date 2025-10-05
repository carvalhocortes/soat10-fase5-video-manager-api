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
      COGNITO_USER_POOL_ID   = data.aws_ssm_parameter.cognito_user_pool_id.value
      COGNITO_CLIENT_ID      = data.aws_ssm_parameter.cognito_client_id.value
      FILE_UPLOAD_TABLE_NAME = var.DYNAMODB_TABLE_NAME
      S3_BUCKET_NAME         = var.S3_BUCKET_NAME
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
      COGNITO_USER_POOL_ID   = data.aws_ssm_parameter.cognito_user_pool_id.value
      COGNITO_CLIENT_ID      = data.aws_ssm_parameter.cognito_client_id.value
      FILE_UPLOAD_TABLE_NAME = var.DYNAMODB_TABLE_NAME
      S3_BUCKET_NAME         = var.S3_BUCKET_NAME
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
      COGNITO_USER_POOL_ID   = data.aws_ssm_parameter.cognito_user_pool_id.value
      COGNITO_CLIENT_ID      = data.aws_ssm_parameter.cognito_client_id.value
      FILE_UPLOAD_TABLE_NAME = var.DYNAMODB_TABLE_NAME
      S3_BUCKET_NAME         = var.S3_BUCKET_NAME
    }
  }
}

resource "aws_lambda_function" "s3_event_handler" {
  function_name    = "s3-event-handler"
  filename         = "../lambda.zip"
  source_code_hash = filebase64sha256("../lambda.zip")
  handler          = "index.s3EventHandler"
  runtime          = "nodejs22.x"
  role             = "arn:aws:iam::${var.AWS_ACCOUNT_ID}:role/LabRole"
  timeout          = 10

  environment {
    variables = {
      FILE_UPLOAD_TABLE_NAME = var.DYNAMODB_TABLE_NAME
      S3_BUCKET_NAME         = var.S3_BUCKET_NAME
    }
  }
}

resource "aws_lambda_function" "sqs_event_handler" {
  function_name    = "sqs-event-handler"
  filename         = "../lambda.zip"
  source_code_hash = filebase64sha256("../lambda.zip")
  handler          = "index.sqsEventHandler"
  runtime          = "nodejs22.x"
  role             = "arn:aws:iam::${var.AWS_ACCOUNT_ID}:role/LabRole"
  timeout          = 30

  environment {
    variables = {
      FILE_UPLOAD_TABLE_NAME = var.DYNAMODB_TABLE_NAME
    }
  }
}

