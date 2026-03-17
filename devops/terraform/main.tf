terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "ostora-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "ostora-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "Ostora"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# ==================== ECR Repositories ====================

module "ecr" {
  source = "./modules/ecr"

  project_name = var.project_name
  environment  = var.environment
  
  repositories = [
    "api-gateway",
    "auth-service",
    "user-service",
    "job-service",
    "email-service",
    "scraping-service",
    "ai-service",
    "payment-service",
    "analytics-service",
    "b2b-service",
    "notification-service",
    "networking-service"
  ]
}

# ==================== VPC ====================

module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  version = "5.1.2"

  name = "${var.project_name}-vpc-${var.environment}"
  cidr = var.vpc_cidr

  azs             = var.availability_zones
  private_subnets = var.private_subnet_cidrs
  public_subnets  = var.public_subnet_cidrs

  enable_nat_gateway   = true
  single_nat_gateway   = var.environment != "production"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    "kubernetes.io/cluster/${var.project_name}-eks-${var.environment}" = "shared"
  }

  public_subnet_tags = {
    "kubernetes.io/role/elb" = "1"
  }

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = "1"
  }
}

# ==================== EKS Cluster ====================

module "eks" {
  source = "./modules/eks"

  project_name = var.project_name
  environment  = var.environment
  
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnets
  
  cluster_version = "1.28"
  
  node_groups = {
    general = {
      desired_size = 3
      min_size     = 2
      max_size     = 10
      instance_types = ["t3.large"]
      capacity_type  = "ON_DEMAND"
    }
    spot = {
      desired_size = 2
      min_size     = 0
      max_size     = 5
      instance_types = ["t3.large", "t3a.large"]
      capacity_type  = "SPOT"
    }
  }
}

# ==================== RDS PostgreSQL ====================

module "rds" {
  source = "./modules/rds"

  project_name = var.project_name
  environment  = var.environment
  
  vpc_id              = module.vpc.vpc_id
  subnet_ids          = module.vpc.private_subnets
  allowed_cidr_blocks = module.vpc.private_subnets_cidr_blocks
  
  engine_version      = "16.1"
  instance_class      = var.environment == "production" ? "db.t3.large" : "db.t3.medium"
  allocated_storage   = var.environment == "production" ? 100 : 20
  max_allocated_storage = var.environment == "production" ? 500 : 100
  
  database_name       = "ostora"
  master_username     = "postgres"
  
  backup_retention_period = var.environment == "production" ? 30 : 7
  multi_az               = var.environment == "production"
  deletion_protection    = var.environment == "production"
}

# ==================== ElastiCache Redis ====================

module "elasticache" {
  source = "./modules/elasticache"

  project_name = var.project_name
  environment  = var.environment
  
  vpc_id              = module.vpc.vpc_id
  subnet_ids          = module.vpc.private_subnets
  allowed_cidr_blocks = module.vpc.private_subnets_cidr_blocks
  
  node_type           = var.environment == "production" ? "cache.t3.medium" : "cache.t3.micro"
  num_cache_nodes     = var.environment == "production" ? 3 : 1
  engine_version      = "7.0"
  
  automatic_failover_enabled = var.environment == "production"
}

# ==================== MSK Kafka ====================

module "msk" {
  source = "./modules/msk"

  project_name = var.project_name
  environment  = var.environment
  
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets
  
  kafka_version      = "3.5.1"
  number_of_brokers  = var.environment == "production" ? 3 : 2
  instance_type      = var.environment == "production" ? "kafka.m5.large" : "kafka.t3.small"
  
  ebs_volume_size    = var.environment == "production" ? 100 : 50
}

# ==================== Outputs ====================

output "ecr_repository_urls" {
  description = "ECR repository URLs"
  value       = module.ecr.repository_urls
}

output "eks_cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
  sensitive   = true
}

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "rds_endpoint" {
  description = "RDS endpoint"
  value       = module.rds.endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "Redis endpoint"
  value       = module.elasticache.endpoint
  sensitive   = true
}

output "kafka_bootstrap_brokers" {
  description = "Kafka bootstrap brokers"
  value       = module.msk.bootstrap_brokers
  sensitive   = true
}
