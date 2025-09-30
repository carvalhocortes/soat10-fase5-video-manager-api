#!/bin/bash
# echo "Deploying to LocalStack..."
npm run deploy-build

echo "Updating Lambda functions in LocalStack..."

REGION="us-east-1"
ROLE="arn:aws:iam::000000000000:role/lambda-role"
ZIP_FILE="lambda.zip"
API_NAME="video-manager-api"

awslocal lambda delete-function \
  --function-name listFiles \
  --region "$REGION"

awslocal lambda create-function \
  --function-name listFiles \
  --runtime nodejs22.x \
  --role "$ROLE" \
  --handler index.listFilesHandler \
  --zip-file fileb://"$ZIP_FILE" \
  --region "$REGION"

awslocal lambda delete-function \
  --function-name uploadFiles \
  --region "$REGION"

awslocal lambda create-function \
  --function-name uploadFiles \
  --runtime nodejs22.x \
  --role "$ROLE" \
  --handler index.uploadFilesHandler \
  --zip-file fileb://"$ZIP_FILE" \
  --region "$REGION"

awslocal lambda delete-function \
  --function-name downloadFiles \
  --region "$REGION"

awslocal lambda create-function \
  --function-name downloadFiles \
  --runtime nodejs22.x \
  --role "$ROLE" \
  --handler index.downloadFilesHandler \
  --zip-file fileb://"$ZIP_FILE" \
  --region "$REGION"

# Deploy s3EventHandler Lambda

awslocal lambda delete-function \
  --function-name s3EventHandler \
  --region "$REGION"

awslocal lambda create-function \
  --function-name s3EventHandler \
  --runtime nodejs22.x \
  --role "$ROLE" \
  --handler index.s3EventHandler \
  --zip-file fileb://"$ZIP_FILE" \
  --region "$REGION"

awslocal lambda add-permission \
  --function-name s3EventHandler \
  --region "$REGION" \
  --statement-id s3invoke \
  --action "lambda:InvokeFunction" \
  --principal s3.amazonaws.com \
  --source-arn arn:aws:s3:::video-manager-bucket

awslocal s3api put-bucket-notification-configuration \
  --bucket video-manager-bucket \
  --notification-configuration '{
    "LambdaFunctionConfigurations": [
      {
        "Id": "S3UploadTrigger",
        "LambdaFunctionArn": "arn:aws:lambda:'"$REGION"':000000000000:function:s3EventHandler",
        "Events": ["s3:ObjectCreated:*"],
        "Filter": {
          "Key": {
            "FilterRules": [
              { "Name": "prefix", "Value": "uploads/" }
            ]
          }
        }
      }
    ]
  }'

echo "Configuring API Gateway..."

# 1. Criar a REST API

API_ID=$(awslocal apigateway create-rest-api \
  --name "$API_NAME" \
  --region "$REGION" \
  --query 'id' --output text)

echo "API Gateway created with ID: $API_ID"

# 2. Obter o ID do recurso raiz ("/")
PARENT_RESOURCE_ID=$(awslocal apigateway get-resources \
  --rest-api-id "$API_ID" \
  --region "$REGION" \
  --query 'items[?path==`/`].id' --output text)

# --- Configurar o endpoint /files ---

# 3. Criar o recurso /files
RESOURCE_ID_FILES=$(awslocal apigateway create-resource \
  --rest-api-id "$API_ID" \
  --parent-id "$PARENT_RESOURCE_ID" \
  --path-part "files" \
  --region "$REGION" \
  --query 'id' --output text)

# 4. Criar o método GET em /files e integrar com o Lambda listFiles
awslocal apigateway put-method \
  --rest-api-id "$API_ID" \
  --resource-id "$RESOURCE_ID_FILES" \
  --http-method GET \
  --authorization-type "NONE" \
  --region "$REGION"

awslocal apigateway put-integration \
  --rest-api-id "$API_ID" \
  --resource-id "$RESOURCE_ID_FILES" \
  --http-method GET \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:000000000000:function:listFiles/invocations" \
  --region "$REGION"

# 5. Criar o método POST em /files e integrar com o Lambda uploadFiles
awslocal apigateway put-method \
  --rest-api-id "$API_ID" \
  --resource-id "$RESOURCE_ID_FILES" \
  --http-method POST \
  --authorization-type "NONE" \
  --region "$REGION"

awslocal apigateway put-integration \
  --rest-api-id "$API_ID" \
  --resource-id "$RESOURCE_ID_FILES" \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:000000000000:function:uploadFiles/invocations" \
  --region "$REGION"


# --- Configurar o endpoint /files/{fileId} ---

# 6. Criar o recurso de parâmetro de caminho /{fileId}
RESOURCE_ID_FILENAME=$(awslocal apigateway create-resource \
  --rest-api-id "$API_ID" \
  --parent-id "$RESOURCE_ID_FILES" \
  --path-part "{fileId}" \
  --region "$REGION" \
  --query 'id' --output text)

# 7. Criar o método GET em /files/{fileId} e integrar com o Lambda downloadFiles
awslocal apigateway put-method \
  --rest-api-id "$API_ID" \
  --resource-id "$RESOURCE_ID_FILENAME" \
  --http-method GET \
  --authorization-type "NONE" \
  --region "$REGION"

awslocal apigateway put-integration \
  --rest-api-id "$API_ID" \
  --resource-id "$RESOURCE_ID_FILENAME" \
  --http-method GET \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$REGION:000000000000:function:downloadFiles/invocations" \
  --region "$REGION"

# 8. Fazer o deploy da API para um stage (ex: 'dev')
STAGE_NAME="dev"
awslocal apigateway create-deployment \
  --rest-api-id "$API_ID" \
  --stage-name "$STAGE_NAME" \
  --region "$REGION"

echo "API Gateway deployed to stage '$STAGE_NAME'"
echo "Endpoint URL: http://localhost:4566/restapis/$API_ID/$STAGE_NAME"
