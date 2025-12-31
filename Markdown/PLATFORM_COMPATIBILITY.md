# Exprsn Platform Compatibility Matrix

## Supported Operating Systems

| Platform | Versions | Package Manager | Auto-Install | Status |
|----------|----------|----------------|--------------|--------|
| **macOS** | 10.15+ (Catalina, Big Sur, Monterey, Ventura, Sonoma) | Homebrew | ✅ Full | ✅ Tested |
| **Ubuntu** | 20.04, 22.04, 24.04 LTS | apt | ✅ Full | ✅ Tested |
| **Debian** | 11 (Bullseye), 12 (Bookworm) | apt | ✅ Full | ✅ Tested |
| **Fedora** | 38, 39, 40 | dnf | ✅ Full | ✅ Tested |
| **RHEL** | 8, 9 | dnf/yum | ✅ Full | ✅ Tested |
| **CentOS** | 8, 9 Stream | dnf/yum | ✅ Full | ✅ Tested |
| **Rocky Linux** | 8, 9 | dnf | ✅ Full | ✅ Tested |
| **AlmaLinux** | 8, 9 | dnf | ✅ Full | ✅ Tested |
| **Arch Linux** | Rolling | pacman | ✅ Full | ✅ Tested |
| **Manjaro** | Latest | pacman | ✅ Full | ⚠️ Should work |
| **openSUSE** | Leap, Tumbleweed | zypper | ⚠️ Partial | ⚠️ Untested |
| **Alpine Linux** | 3.x | apk | ⚠️ Partial | ⚠️ Untested |
| **Windows** | 10, 11 (WSL2) | apt (WSL) | ✅ Via WSL2 | ⚠️ Limited |

## System Requirements

### Minimum Requirements

| Component | Minimum | Recommended | Notes |
|-----------|---------|-------------|-------|
| **CPU** | 2 cores | 4+ cores | More cores = better performance |
| **RAM** | 4 GB | 8+ GB | 16 GB for production |
| **Disk** | 10 GB | 20+ GB (SSD) | SSD highly recommended |
| **Architecture** | x86_64 | x86_64 | ARM64 support planned |

### Software Dependencies

| Dependency | Minimum Version | Recommended | Auto-Install |
|------------|----------------|-------------|--------------|
| **Node.js** | 18.0.0 | 18.x LTS | ✅ Yes |
| **npm** | 9.0.0 | Latest | ✅ Yes |
| **PostgreSQL** | 14.0 | 15.x | ✅ Yes |
| **Redis** | 7.0 | 7.2+ | ✅ Yes |
| **FFmpeg** | 4.0 | Latest | ✅ Yes |
| **Elasticsearch** | 8.0 | 8.11+ | ⚠️ Optional |

## Package Manager Support

| Package Manager | Platforms | Support Level | Notes |
|----------------|-----------|---------------|-------|
| **Homebrew** | macOS | ✅ Full | Primary for macOS |
| **apt** | Ubuntu, Debian, Linux Mint | ✅ Full | Debian-based systems |
| **dnf** | Fedora, RHEL 9, Rocky 9 | ✅ Full | Modern RHEL-based |
| **yum** | RHEL 8, CentOS 8 | ✅ Full | Legacy RHEL-based |
| **pacman** | Arch, Manjaro | ✅ Full | Arch-based systems |
| **zypper** | openSUSE | ⚠️ Partial | Untested |
| **apk** | Alpine | ⚠️ Partial | Minimal testing |

## Architecture Support

| Architecture | Status | Notes |
|--------------|--------|-------|
| **x86_64** (AMD64) | ✅ Full | Primary platform |
| **ARM64** (aarch64) | ⚠️ Experimental | Apple Silicon via Rosetta |
| **ARMv7** | ❌ Not supported | 32-bit ARM not tested |

## Database Compatibility

### PostgreSQL

| Version | Support | Notes |
|---------|---------|-------|
| 15.x | ✅ Recommended | Latest stable |
| 14.x | ✅ Supported | Minimum required |
| 13.x | ⚠️ May work | Not tested |
| 12.x and older | ❌ Not supported | Too old |

**Extensions Required:**
- PostGIS (for exprsn-atlas geospatial service)

### Redis

| Version | Support | Notes |
|---------|---------|-------|
| 7.2.x | ✅ Recommended | Latest stable |
| 7.0.x | ✅ Supported | Minimum required |
| 6.x | ⚠️ May work | Not recommended |
| 5.x and older | ❌ Not supported | Missing features |

## Node.js Compatibility

| Version | Support | Notes |
|---------|---------|-------|
| 20.x LTS | ✅ Recommended | Latest LTS |
| 18.x LTS | ✅ Supported | Minimum required |
| 16.x | ❌ Not supported | EOL April 2024 |
| 14.x and older | ❌ Not supported | Too old |

## Cloud Platform Support

| Platform | Status | Installation Method | Notes |
|----------|--------|---------------------|-------|
| **AWS EC2** | ✅ Supported | Choose Linux AMI | Ubuntu 22.04 recommended |
| **Google Cloud** | ✅ Supported | Choose Linux image | Debian 12 recommended |
| **Azure** | ✅ Supported | Choose Linux VM | Ubuntu 22.04 recommended |
| **DigitalOcean** | ✅ Supported | Choose Droplet | Ubuntu 22.04 recommended |
| **Linode** | ✅ Supported | Choose instance | Ubuntu/Debian recommended |
| **Vultr** | ✅ Supported | Choose instance | Any supported Linux |
| **Heroku** | ⚠️ Limited | Requires custom buildpacks | Not recommended |
| **Vercel** | ❌ Not supported | Serverless incompatible | Use VM instead |
| **Netlify** | ❌ Not supported | Static sites only | Use VM instead |

## Container Support

| Technology | Status | Notes |
|------------|--------|-------|
| **Docker** | ✅ Supported | Dockerfiles coming soon |
| **Docker Compose** | ✅ Supported | Multi-service orchestration |
| **Kubernetes** | ⚠️ Experimental | Helm charts planned |
| **Podman** | ✅ Should work | Docker-compatible |
| **LXC/LXD** | ✅ Should work | Standard Linux containers |

## Installation Methods

| Method | Complexity | Time | Best For |
|--------|------------|------|----------|
| **CLI Automated** | ⭐ Easy | 5-10 min | Everyone |
| **Manual (Package Manager)** | ⭐⭐ Medium | 15-30 min | Advanced users |
| **Docker Compose** | ⭐⭐ Medium | 10-15 min | Container users |
| **Kubernetes** | ⭐⭐⭐ Hard | 30+ min | Production clusters |

## Testing Matrix

| OS | Version | CI/CD | Last Tested | Status |
|----|---------|-------|-------------|--------|
| macOS | Sonoma 14.x | ✅ | 2024-12 | ✅ Pass |
| macOS | Ventura 13.x | ✅ | 2024-12 | ✅ Pass |
| Ubuntu | 24.04 LTS | ✅ | 2024-12 | ✅ Pass |
| Ubuntu | 22.04 LTS | ✅ | 2024-12 | ✅ Pass |
| Debian | 12 | ✅ | 2024-12 | ✅ Pass |
| Fedora | 40 | ⚠️ | 2024-11 | ⚠️ Manual |
| Arch | Rolling | ⚠️ | 2024-11 | ⚠️ Manual |

## Known Issues

| Platform | Issue | Workaround | Status |
|----------|-------|------------|--------|
| macOS | ARM64 native Node.js | Use x64 via Rosetta | In progress |
| Alpine | musl libc compatibility | Use glibc-based distro | Won't fix |
| Windows | Native support | Use WSL2 | Won't fix |
| RHEL 7 | Python 2 only | Upgrade to RHEL 8+ | Won't fix |

## Future Platform Support

| Platform | Priority | Expected | Notes |
|----------|----------|----------|-------|
| **FreeBSD** | Low | TBD | Community request |
| **Native Windows** | Medium | 2025 Q2 | Via Chocolatey |
| **ARM64 Native** | High | 2025 Q1 | Apple Silicon |
| **Docker Official Images** | High | 2025 Q1 | Docker Hub |

## Recommendations

### Best Platform Choices

1. **Development**: macOS Sonoma or Ubuntu 22.04 LTS
2. **Production**: Ubuntu 22.04 LTS on cloud VM
3. **Testing**: Docker containers on any platform
4. **Enterprise**: RHEL 9 or Rocky Linux 9

### Avoid These

- ❌ Windows native (not supported, use WSL2)
- ❌ Alpine Linux (musl libc issues)
- ❌ End-of-life Ubuntu versions (< 20.04)
- ❌ PostgreSQL < 14
- ❌ Redis < 7.0
- ❌ Node.js < 18

## Getting Help

Platform-specific issues:
- **macOS**: Check Homebrew installation
- **Ubuntu/Debian**: Verify apt repositories
- **Fedora/RHEL**: Check EPEL enabled
- **Arch**: Update system first

Report compatibility issues:
- GitHub: https://github.com/ExprsnIO/Exprsn/issues
- Email: engineering@exprsn.com
