terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "ostora-terraform-state"
    key    = "ostora/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC
resource "aws_vpc" "ostora_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "ostora-vpc"
    Environment = var.environment
  }
}

# Subnets
resource "aws_subnet" "public_subnet_1" {
  vpc_id                  = aws_vpc.ostora_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name = "ostora-public-subnet-1"
  }
}

resource "aws_subnet" "public_subnet_2" {
  vpc_id                  = aws_vpc.ostora_vpc.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "${var.aws_region}b"
  map_public_ip_on_launch = true

  tags = {
    Name = "ostora-public-subnet-2"
  }
}

resource "aws_subnet" "private_subnet_1" {
  vpc_id            = aws_vpc.ostora_vpc.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = "${var.aws_region}a"

  tags = {
    Name = "ostora-private-subnet-1"
  }
}

resource "aws_subnet" "private_subnet_2" {
  vpc_id            = aws_vpc.ostora_vpc.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = "${var.aws_region}b"

  tags = {
    Name = "ostora-private-subnet-2"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "ostora_igw" {
  vpc_id = aws_vpc.ostora_vpc.id

  tags = {
    Name = "ostora-igw"
  }
}

# RDS PostgreSQL
resource "aws_db_instance" "ostora_postgres" {
  identifier             = "ostora-postgres"
  engine                 = "postgres"
  engine_version         = "16.1"
  instance_class         = var.db_instance_class
  allocated_storage      = 100
  storage_type           = "gp3"
  db_name                = "ostora_db"
  username               = var.db_username
  password               = var.db_password
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.ostora_db_subnet.name
  skip_final_snapshot    = var.environment == "production" ? false : true
  multi_az               = var.environment == "production" ? true : false

  tags = {
    Name = "ostora-postgres"
  }
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "ostora_redis" {
  cluster_id           = "ostora-redis"
  engine               = "redis"
  node_type            = var.redis_node_type
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  security_group_ids   = [aws_security_group.redis_sg.id]
  subnet_group_name    = aws_elasticache_subnet_group.ostora_redis_subnet.name

  tags = {
    Name = "ostora-redis"
  }
}

# EKS Cluster
resource "aws_eks_cluster" "ostora_eks" {
  name     = "ostora-cluster"
  role_arn = aws_iam_role.eks_cluster_role.arn
  version  = "1.28"

  vpc_config {
    subnet_ids = [
      aws_subnet.private_subnet_1.id,
      aws_subnet.private_subnet_2.id
    ]
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy
  ]
}

# S3 Bucket for uploads
resource "aws_s3_bucket" "ostora_uploads" {
  bucket = "ostora-uploads-${var.environment}"

  tags = {
    Name        = "ostora-uploads"
    Environment = var.environment
  }
}

# Security Groups
resource "aws_security_group" "db_sg" {
  name        = "ostora-db-sg"
  description = "Security group for RDS"
  vpc_id      = aws_vpc.ostora_vpc.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "redis_sg" {
  name        = "ostora-redis-sg"
  description = "Security group for Redis"
  vpc_id      = aws_vpc.ostora_vpc.id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# DB Subnet Group
resource "aws_db_subnet_group" "ostora_db_subnet" {
  name       = "ostora-db-subnet"
  subnet_ids = [aws_subnet.private_subnet_1.id, aws_subnet.private_subnet_2.id]

  tags = {
    Name = "ostora-db-subnet"
  }
}

# ElastiCache Subnet Group
resource "aws_elasticache_subnet_group" "ostora_redis_subnet" {
  name       = "ostora-redis-subnet"
  subnet_ids = [aws_subnet.private_subnet_1.id, aws_subnet.private_subnet_2.id]
}

# IAM Role for EKS
resource "aws_iam_role" "eks_cluster_role" {
  name = "ostora-eks-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "eks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster_role.name
}
