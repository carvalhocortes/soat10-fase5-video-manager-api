export $(awk '/\[default\]/{flag=1;next}/\[/{flag=0}flag && NF' ~/.aws/credentials | sed 's/ = /=/g')
gh secret set AWS_ACCESS_KEY_ID -b"$aws_access_key_id"
gh secret set AWS_SECRET_ACCESS_KEY -b"$aws_secret_access_key"
gh secret set AWS_SESSION_TOKEN -b"$aws_session_token"

export $(grep -v '^\s*#' ./.env | grep -E '^\s*[A-Za-z_][A-Za-z0-9_]*\s*=' | sed 's/ = /=/g')
gh secret set TF_VAR_aws_region -b"$AWS_REGION"
export TF_VAR_aws_region="$AWS_REGION"
gh secret set AWS_REGION -b"$AWS_REGION"

gh secret set TF_VAR_AWS_ACCOUNT_ID -b"$AWS_ACCOUNT_ID"
export TF_VAR_AWS_ACCOUNT_ID="$AWS_ACCOUNT_ID"
