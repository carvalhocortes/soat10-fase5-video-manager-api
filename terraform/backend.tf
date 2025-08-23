terraform {
  backend "s3" {
    bucket = "postech-soat10-bucket-fase5"
    key    = "github-actions-fiap/kubernets/terraform.tfstate"

    region  = "us-west-2"
    encrypt = true
  }

  required_version = ">= 1.2.0"

}
