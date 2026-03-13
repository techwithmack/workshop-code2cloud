# Open Source AppSec Workshop Cheat Sheet

This workshop demonstrates **how to secure applications using open source tools**.  
The goal is **not** to build a full AppSec program, but to show what is available and how it works.

We will cover three stages of security:

1. **Local Scanning** – run security tools against a local repo  
2. **Active Blockers** – stop issues before they enter the repo  
3. **CI Scanning** – automate security checks using GitHub Actions  
4. **Security Dashboard** – import results into **DefectDojo**

Tools used in this workshop:

- **Trivy** – Vulnerable dependency scanning
- **SafeChain** – Malware protection for dependencies
- **BetterLeaks** – Secret detection
- **Aikido Pre-Commit** – Secret blocking at commit time
- **Opengrep** – SAST scanning
- **Checkov** – Infrastructure as Code scanning
- **DefectDojo** – Security findings dashboard

---

# Trivy – Dependency Vulnerability Scanning

## Install

### Mac

```bash
brew install trivy
```

### Windows

Download from:

https://github.com/aquasecurity/trivy/releases

Add the binary to your PATH.

---

## Run Local Scan

Scan the current repository:

```bash
trivy repo .
```

Export results for DefectDojo:

```bash
trivy repo . --format json --output trivy.json
```

---

## GitHub Action

Create `.github/workflows/trivy.yml`

```yaml
name: trivy

on:
  push:
  pull_request:

jobs:
  trivy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Run Trivy
        uses: aquasecurity/trivy-action@0.33.1
        with:
          scan-type: fs
          scan-ref: .
          format: json
          output: trivy.json

      - uses: actions/upload-artifact@v4
        with:
          name: trivy-report
          path: trivy.json
```

---

# SafeChain – Block Malware in Dependencies

SafeChain protects your dependency installs.

## Install

### Mac / Linux

```bash
curl -fsSL https://github.com/AikidoSec/safe-chain/releases/latest/download/install-safe-chain.sh | sh
```

### Windows

```powershell
iex (iwr "https://github.com/AikidoSec/safe-chain/releases/latest/download/install-safe-chain.ps1" -UseBasicParsing)
```

Restart your terminal after install.

---

## Test SafeChain

Verify installation:

```bash
npm safe-chain-verify
```

Test malware blocking:

```bash
npm install safe-chain-test
```

If SafeChain works, the install will be blocked.

---

# Secrets Detection

## Install BetterLeaks

### Mac

```bash
brew install betterleaks
```

### Windows (Docker)

```bash
docker pull ghcr.io/betterleaks/betterleaks:latest
```

---

## Run Local Scan

```bash
betterleaks dir .
```

Export SARIF report:

```bash
betterleaks dir . --report-format sarif --report-path betterleaks.sarif
```

---

## Install Aikido Git Hook

This blocks secrets **before commits**.

### Mac / Linux

```bash
curl -fsSL https://raw.githubusercontent.com/AikidoSec/pre-commit/main/installation-samples/install-global/install-aikido-hook.sh | bash
```

### Windows

```powershell
iex (iwr "https://raw.githubusercontent.com/AikidoSec/pre-commit/main/installation-samples/install-global/install-aikido-hook.ps1" -UseBasicParsing)
```

Test it:

```bash
git add file.js
git commit -m "test"
```

If a secret is detected, the commit will be blocked.

---

# SAST – Static Application Security Testing

We use **Opengrep**, an open source fork of Semgrep.

## Install Opengrep

### Mac / Linux

```bash
curl -fsSL https://raw.githubusercontent.com/opengrep/opengrep/main/install.sh | bash
```

### Windows

```powershell
irm https://raw.githubusercontent.com/opengrep/opengrep/main/install.ps1 | iex
```

---

## Download Rules

```bash
git clone https://github.com/semgrep/semgrep-rules.git
```

---

## Run Local Scan

```bash
opengrep scan -f semgrep-rules .
```

Export SARIF:

```bash
opengrep scan --sarif-output=opengrep.sarif -f semgrep-rules .
```

---

## GitHub Action

Create `.github/workflows/opengrep.yml`

```yaml
name: opengrep

on:
  push:
  pull_request:

jobs:
  scan:
    runs-on: ubuntu-latest
    permissions:
      security-events: write

    steps:
      - uses: actions/checkout@v4

      - run: curl -fsSL https://raw.githubusercontent.com/opengrep/opengrep/main/install.sh | bash

      - run: |
          git clone https://github.com/semgrep/semgrep-rules.git
          opengrep scan --sarif-output=opengrep.sarif -f semgrep-rules .

      - uses: github/codeql-action/upload-sarif@v4
        with:
          sarif_file: opengrep.sarif
```

---

# IaC Security – Checkov

Checkov scans Terraform, CloudFormation, Kubernetes and more.

## Install

### Mac

```bash
brew install checkov
```

### Windows

```bash
pip install checkov
```

---

## Run Local Scan

```bash
checkov -d .
```

Export JSON for DefectDojo:

```bash
checkov -d . -o json > checkov.json
```

---

## GitHub Action

Create `.github/workflows/checkov.yml`

```yaml
name: checkov

on:
  push:
  pull_request:

jobs:
  scan:
    runs-on: ubuntu-latest
    permissions:
      security-events: write

    steps:
      - uses: actions/checkout@v4

      - uses: bridgecrewio/checkov-action@v12
        with:
          directory: .
          output_format: sarif
          output_file_path: results.sarif

      - uses: github/codeql-action/upload-sarif@v4
        with:
          sarif_file: results.sarif
```

---

# DefectDojo – Security Dashboard

Now that we have scan results, we can import them into **DefectDojo**.

## Install DefectDojo

```bash
git clone https://github.com/DefectDojo/django-DefectDojo.git
cd django-DefectDojo

docker compose build
docker/setEnv.sh release
docker compose up
```

Open:

```
http://localhost:8080
```

Login:

```
user: admin
```

Password is printed in the initializer container logs.

---

# Add Local Trivy Scan to DefectDojo

1. Create Product  
2. Create Engagement  
3. Click **Import Scan**

Upload:

```
trivy.json
```

Scan Type:

```
Trivy Scan
```

---

# Send GitHub Action Results to DefectDojo

Example step after scans complete:

```yaml
- name: Upload to DefectDojo
  run: |
    curl -X POST "$DEFECTDOJO_URL/api/v2/import-scan/" \
    -H "Authorization: Token $DD_TOKEN" \
    -F "file=@trivy.json" \
    -F "scan_type=Trivy Scan" \
    -F "engagement=$DD_ENGAGEMENT_ID"
```

Environment variables required:

```
DEFECTDOJO_URL
DD_TOKEN
DD_ENGAGEMENT_ID
```

---

# Summary

This workshop demonstrates a **simple open source AppSec pipeline**.

### Local Scanning

- Trivy
- BetterLeaks
- Opengrep
- Checkov

### Prevention

- SafeChain
- Aikido Git Hooks

### CI Automation

- GitHub Actions

### Security Dashboard

- DefectDojo

Together these tools provide a lightweight but powerful **open source security stack for modern development**.