# 🎥 Video Manager API - FIAP SOAT10 Fase 5

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-22.x-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![AWS Lambda](https://img.shields.io/badge/AWS-Lambda-orange.svg)](https://aws.amazon.com/lambda/)
[![Terraform](https://img.shields.io/badge/IaC-Terraform-purple.svg)](https://www.terraform.io/)
[![Test Coverage](https://img.shields.io/badge/coverage-94.49%25-brightgreen.svg)](https://github.com/carvalhocortes/soat10-video-manager-api)

## 📋 Sobre o Projeto

API serverless de gerenciamento de vídeos desenvolvida para a **Quinta Fase da Pós-Graduação em Arquitetura de Software da FIAP - Turma SOAT10**.

Este microserviço é responsável pelo **upload**, **download** e **listagem** de arquivos de vídeo, implementando um sistema serverless na AWS com foco em **segurança**, **escalabilidade** e **alta disponibilidade**.

### 🎯 Objetivos da Fase 5

- Implementar sistema de upload de vídeos com URLs pré-assinadas do S3
- Integrar autenticação segura com AWS Cognito
- Aplicar padrões de arquitetura serverless
- Demonstrar uso de Infrastructure as Code (IaC) com Terraform
- Aplicar práticas de DevOps e CI/CD com cobertura de testes >90%

## 🏗️ Arquitetura

### Visão Geral

```
┌─────────────────┐    ┌────────────────────┐    ┌─────────────────┐
│   API Gateway   │───▶│  Lambda Functions  │───▶│    Amazon S3    │
│                 │    │   - upload-files   │    │  Video Storage  │
└─────────────────┘    │   - download-files │    └─────────────────┘
                       │   - list-files     │
                       │   - s3-event       │    ┌─────────────────┐
                       └────────────────────┘───▶│   DynamoDB      │
                                ▲                │ File Metadata   │
                                │                └─────────────────┘
                       ┌────────────────────┐
                       │   AWS Cognito      │
                       │   User Pool        │
                       └────────────────────┘
```

### Componentes Principais

1. **API Gateway**: Ponto de entrada para as requisições HTTP
2. **AWS Lambda**: 4 funções serverless para processamento de vídeos
3. **Amazon S3**: Armazenamento de arquivos de vídeo
4. **DynamoDB**: Metadados dos uploads e controle de status
5. **AWS Cognito**: Autenticação e autorização de usuários
6. **SSM Parameter Store**: Armazenamento seguro de configurações
7. **Terraform**: Infrastructure as Code

## 🚀 Funcionalidades

### � Upload de Vídeos (`POST /upload`)

- Geração de URLs pré-assinadas do S3 para upload direto
- Validação de tipos de arquivo (MP4, AVI, MOV, WMV, FLV, WebM, MKV, M4V, 3GP)
- Validação de tamanho (máximo 1GB)
- Controle de status de upload via DynamoDB
- Processamento automático via eventos S3

### � Download de Vídeos (`GET /download/{fileId}`)

- URLs pré-assinadas para download seguro
- Controle de acesso por usuário
- Headers apropriados para download de arquivo
- Validação de existência do arquivo

### 📋 Listagem de Vídeos (`GET /list`)

- Listagem dos vídeos do usuário autenticado
- Filtros por status de upload
- Paginação e ordenação
- Metadados completos dos arquivos

## 🛠️ Tecnologias e Justificativas

### Backend

| Tecnologia     | Versão | Justificativa                                     |
| -------------- | ------ | ------------------------------------------------- |
| **AWS Lambda** | -      | Serverless, pay-per-use, auto-scaling             |
| **Amazon S3**  | -      | Armazenamento massivo, durabilidade 99.999999999% |
| **DynamoDB**   | -      | NoSQL serverless, baixa latência, auto-scaling    |

### Infraestrutura

| Tecnologia              | Justificativa                                    |
| ----------------------- | ------------------------------------------------ |
| **Terraform**           | IaC declarativo, versionamento de infraestrutura |
| **AWS API Gateway**     | Gerenciamento de APIs, throttling, caching       |
| **S3 Pre-signed URLs**  | Upload/download direto, sem passar pelo servidor |
| **SSM Parameter Store** | Armazenamento seguro de secrets com criptografia |

### DevOps e Qualidade

| Ferramenta              | Justificativa                            |
| ----------------------- | ---------------------------------------- |
| **Jest**                | Framework de testes com cobertura 94.49% |
| **ESLint + Prettier**   | Padronização de código e formatação      |
| **Husky + Lint-staged** | Git hooks para qualidade de código       |
| **GitHub Actions**      | CI/CD automatizado                       |
| **AWS CloudWatch**      | Monitoramento e logs centralizados       |

## 🏛️ Arquitetura do Código

### Clean Architecture + Serverless

```
src/
├── index.ts          # Exportação dos handlers Lambda
├── domain/           # Entidades e regras de negócio
│   ├── FileUploadRecord.ts    # Entidade de upload
│   └── CustomErrors.ts        # Exceções específicas do domínio
├── infrastructure/   # Adaptadores externos
│   ├── handlers/     # Controladores (AWS Lambda)
│   │   ├── uploadFilesHandler.ts
│   │   ├── downloadFilesHandler.ts
│   │   ├── listFilesHandler.ts
│   │   └── s3EventHandler.ts
│   ├── middlewares/  # Middleware de autenticação e erro
│   │   ├── authMiddleware.ts
│   │   ├── errorMiddleware.ts
│   │   └── responseMiddleware.ts
│   ├── services/     # Serviços externos
│   │   └── S3UploadService.ts
│   ├── db/          # Repositórios de dados
│   │   └── FileUploadRepository.ts
│   └── validation/   # Validação de entrada
│       └── uploadValidation.ts
```

### Justificativas Arquiteturais

#### 1. **Clean Architecture**

- **Separação de responsabilidades**: Cada camada tem uma responsabilidade específica
- **Independência de frameworks**: Regras de negócio não dependem de tecnologias externas
- **Testabilidade**: Fácil criação de mocks e testes unitários
- **Manutenibilidade**: Mudanças em uma camada não afetam outras

#### 2. **Domain-Driven Design**

- **Entidades de domínio**: `FileUploadRecord` representa o conceito central do negócio
- **Validações no domínio**: Regras de negócio ficam nas entidades
- **Custom Errors**: Exceções específicas do domínio (ValidationError, AuthenticationError, etc.)
- **Linguagem ubíqua**: Nomes que fazem sentido para o negócio

#### 3. **Repository Pattern**

- **Abstração de dados**: Interface `FileUploadRepository` abstrai o DynamoDB
- **Facilita testes**: Permite mocks fáceis para testes unitários
- **Troca de implementação**: Pode trocar DynamoDB por outra solução

#### 4. **Service Layer**

- **S3UploadService**: Abstração para operações com S3
- **AuthMiddleware**: Middleware para autenticação JWT
- **Validação centralizada**: Yup schemas para validação de entrada

## 🔧 Configuração e Deploy

### Pré-requisitos

- Node.js 22.x
- AWS CLI configurado
- Terraform >= 1.0.0
- Conta AWS com permissões adequadas

### Instalação

```bash
# Clone o repositório
git clone https://github.com/carvalhocortes/soat10-fase5-video-manager-api.git
cd soat10-fase5-video-manager-api

# Instale as dependências
npm install

# Execute os testes
npm test

# Build do projeto para deploy
npm run deploy-build
```

### Deploy

```bash
# 1. Configure as variáveis do Terraform
cp terraform.tfvars.example terraform.tfvars
# Edite o arquivo com suas configurações

# 2. Faça o build da aplicação
npm run deploy-build

# 3. Inicialize o Terraform
cd terraform
terraform init

# 4. Aplique a infraestrutura
terraform plan
terraform apply

# 5. Configure o LocalStack (desenvolvimento)
docker-compose up -d
./deployLocalStack.sh
```

## 🧪 Testes

### Estratégia de Testes

- **Testes Unitários**: Cobertura de 94.49% com Jest
- **Testes de Integração**: Mocks do AWS SDK (S3, DynamoDB, Cognito)
- **Testes de Validação**: Yup schemas e middleware de autenticação
- **Testes de Error Handling**: Cenários de erro e edge cases

### Executar Testes

```bash
# Testes unitários
npm test

# Testes com coverage
npm run test:coverage

# Testes em modo watch
npm run test:watch

# Testes para CI
npm run test:ci
```

### Estrutura de Testes

```
src/
├── __tests__/                    # Testes do index
├── domain/__tests__/             # Testes das entidades de domínio
├── infrastructure/
│   ├── handlers/__tests__/       # Testes dos handlers Lambda
│   ├── middlewares/__tests__/    # Testes dos middlewares
│   ├── services/__tests__/       # Testes dos serviços
│   ├── db/__tests__/            # Testes do repositório
│   └── validation/__tests__/     # Testes de validação
```

### Cobertura de Testes

| Arquivo                                              | % Statements | % Branch   | % Functions | % Lines    |
| ---------------------------------------------------- | ------------ | ---------- | ----------- | ---------- |
| **All files**                                        | **94.49%**   | **85.71%** | **97.14%**  | **94.24%** |
| src/index.ts                                         | 100%         | 100%       | 100%        | 100%       |
| src/domain/CustomErrors.ts                           | 84%          | 100%       | 80%         | 84%        |
| src/domain/FileUploadRecord.ts                       | 100%         | 100%       | 100%        | 100%       |
| src/infrastructure/db/FileUploadRepository.ts        | 100%         | 90.9%      | 100%        | 100%       |
| src/infrastructure/handlers/uploadFilesHandler.ts    | 91.3%        | 50%        | 100%        | 90.9%      |
| src/infrastructure/handlers/downloadFilesHandler.ts  | 93.75%       | 50%        | 100%        | 93.33%     |
| src/infrastructure/handlers/listFilesHandler.ts      | 100%         | 100%       | 100%        | 100%       |
| src/infrastructure/handlers/s3EventHandler.ts        | 100%         | 83.33%     | 100%        | 100%       |
| src/infrastructure/middlewares/authMiddleware.ts     | 100%         | 100%       | 100%        | 100%       |
| src/infrastructure/middlewares/errorMiddleware.ts    | 100%         | 100%       | 100%        | 100%       |
| src/infrastructure/middlewares/responseMiddleware.ts | 100%         | 100%       | 100%        | 100%       |
| src/infrastructure/services/S3UploadService.ts       | 92.3%        | 100%       | 100%        | 92.3%      |
| src/infrastructure/validation/uploadValidation.ts    | 87.09%       | 75%        | 100%        | 86.2%      |

**Total de Testes:** 71 passed ✅
**Test Suites:** 9 passed ✅

## 📖 Documentação da API

### OpenAPI/Swagger

A documentação completa da API está disponível em `doc/openapi.yml`.

```bash
# Visualizar documentação
npm run swagger
# Acesse: http://localhost:3000
```

### Endpoints

#### POST /upload

Gera URL pré-assinada para upload de vídeo no S3.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Request:**

```json
{
  "fileName": "meu-video.mp4",
  "fileType": "video/mp4",
  "fileSize": 52428800
}
```

**Response (200):**

```json
{
  "uploadUrl": "https://s3.amazonaws.com/bucket/path?X-Amz-Algorithm=...",
  "fileId": "12345678-1234-1234-1234-123456789012",
  "fileKey": "uploads/user123/1234567890_meu-video.mp4",
  "expiresIn": 3600
}
```

#### GET /download/{fileId}

Gera URL pré-assinada para download de vídeo do S3.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response (200):**

```json
{
  "downloadUrl": "https://s3.amazonaws.com/bucket/path?X-Amz-Algorithm=...",
  "fileName": "meu-video.mp4",
  "expiresIn": 3600
}
```

#### GET /list

Lista os vídeos do usuário autenticado.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response (200):**

```json
{
  "files": [
    {
      "fileId": "12345678-1234-1234-1234-123456789012",
      "fileName": "meu-video.mp4",
      "fileType": "video/mp4",
      "fileSize": 52428800,
      "uploadStatus": "UPLOADED",
      "createdAt": "2023-10-01T10:00:00.000Z",
      "updatedAt": "2023-10-01T10:05:00.000Z"
    }
  ]
}
```

## 🔒 Segurança

### Implementações de Segurança

1. **AWS Cognito**: Autenticação JWT com verificação de assinatura
2. **S3 Pre-signed URLs**: Upload/download seguro sem exposição de credenciais
3. **HTTPS**: Comunicação criptografada via API Gateway
4. **Validação rigorosa**: Tipos de arquivo, tamanho máximo, caracteres especiais
5. **Controle de acesso**: Usuários só acessam seus próprios arquivos
6. **Rate Limiting**: Throttling configurado no API Gateway
7. **Secrets Management**: Uso do SSM Parameter Store para configurações
8. **CORS**: Configuração adequada para acesso cross-origin

### Compliance

- **LGPD**: AWS services compliance com LGPD (Cognito, S3, DynamoDB)
- **OWASP**: Seguimento das práticas do OWASP Top 10
- **Principle of Least Privilege**: IAM roles com permissões mínimas necessárias
- **Data Encryption**: Dados em trânsito e em repouso criptografados
- **Audit Trail**: Logs detalhados no CloudWatch para auditoria

## 📊 Monitoramento e Observabilidade

### Métricas AWS

- **CloudWatch Metrics**: Métricas automáticas do Lambda, API Gateway, S3 e DynamoDB
- **CloudWatch Logs**: Logs estruturados das funções Lambda
- **S3 Event Notifications**: Processamento automático de eventos de upload
- **DynamoDB Streams**: Rastreamento de mudanças nos metadados
- **X-Ray Tracing**: Rastreamento distribuído para debug e performance

## 👥 Equipe

### Turma:

SOAT10 - FIAP Pós-Graduação em Arquitetura de Software

### Desenvolvedores:

- Fernando Carvalho de Paula Cortes - rm360486
- Samuel Victor Santos - rm360487

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

**Desenvolvido com ❤️ para a FIAP SOAT10 - Fase 5**
