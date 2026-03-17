output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.ostora_vpc.id
}

output "eks_cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = aws_eks_cluster.ostora_eks.endpoint
}

output "rds_endpoint" {
  description = "RDS endpoint"
  value       = aws_db_instance.ostora_postgres.endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "Redis endpoint"
  value       = aws_elasticache_cluster.ostora_redis.cache_nodes[0].address
  sensitive   = true
}

output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = aws_s3_bucket.ostora_uploads.id
}
