# Apex Terraform Provider — Specification

Premium marker #3. The provider wraps the Apex Public REST API v1 so
DevOps teams can provision brands, prompts, recommendations, and dashboards
as code.

Status: **spec published, provider implementation in progress**. The spec
is the contract — build tooling can code-gen against this while the
provider itself is in the `terraform-provider-apex` sibling repo.

## Installation

```terraform
terraform {
  required_providers {
    apex = {
      source  = "apex-dev/apex"
      version = "~> 1.0"
    }
  }
}

provider "apex" {
  api_key = var.apex_api_key   # apx_... from Settings → Developer
  api_url = "https://api.apex.dev/v1"  # override for self-hosted
}
```

## Resources

### `apex_brand`

```terraform
resource "apex_brand" "acme" {
  name        = "Acme Corp"
  domain      = "acme.example"
  industry    = "saas"
  description = "B2B SaaS for SMB accounting."
  keywords    = ["accounting software", "small business bookkeeping"]
}
```

Maps to `POST /api/v1/brands` (write endpoints land in v1.1).

### `apex_prompt`

```terraform
resource "apex_prompt" "crm_review" {
  brand_id = apex_brand.acme.id
  query    = "best crm for small business accountants"
  tags     = ["conversion", "bottom-funnel"]
  platforms = [
    "chatgpt", "claude", "perplexity",
    "google_ai_overviews", "copilot",
  ]
  n_runs   = 5   # N-runs averaging per FR-MON-014
}
```

### `apex_dashboard`

```terraform
resource "apex_dashboard" "overview" {
  slug = "overview"
  name = "Overview"
  config = jsonencode({
    widgets = [
      { id = "score", kind = "score_card", position = { x = 0, y = 0, w = 6, h = 4 } },
      { id = "sov",   kind = "sov_chart",   position = { x = 6, y = 0, w = 6, h = 4 } }
    ]
  })
}
```

### `apex_webhook_subscription`

```terraform
resource "apex_webhook_subscription" "deploy_notifier" {
  event      = "score_changed"
  target_url = "https://ops.example.com/apex-hooks"
  brand_id   = apex_brand.acme.id
}
```

### `apex_api_key`

```terraform
resource "apex_api_key" "ci" {
  name    = "ci-pipeline"
  scopes  = ["read:brands", "read:audits", "write:recommendations"]
  expires_in_days = 365
}

output "api_key_value" {
  value     = apex_api_key.ci.value
  sensitive = true
}
```

Key value is only returned on create. Rotation is a separate action.

## Data sources

```terraform
data "apex_brand" "existing" {
  id = "brand_xyz"
}

data "apex_audit_latest" "homepage" {
  brand_id = apex_brand.acme.id
  url      = "https://acme.example/"
}

output "current_score" {
  value = data.apex_audit_latest.homepage.overall_score
}
```

## Import

Every resource supports import by ID:

```bash
terraform import apex_brand.acme brand_xyz
terraform import apex_prompt.crm_review prompt_abc
```

## Rate limits

The provider respects `X-RateLimit-*` headers and throttles proactively.
CI users should provision a dedicated API key with elevated quotas.

## State safety

- `apex_api_key.value` is marked sensitive and NEVER written to plaintext
  state — the provider requires a remote state backend.
- `apex_brand.deletion_protection` is `true` by default; destroys require
  a `terraform destroy` with `-var deletion_protection=false`.
