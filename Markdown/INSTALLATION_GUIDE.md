# Exprsn Installation Guide

Complete installation guide for the Exprsn Certificate Authority Ecosystem across all supported platforms.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Platform-Specific Instructions](#platform-specific-instructions)
3. [Manual Installation](#manual-installation)
4. [Post-Installation](#post-installation)
5. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Using the Installation CLI (Recommended)

```bash
# 1. Install the CLI
npm run cli:install

# 2. Run automated installation
exprsn-install install

# 3. Configure environment
exprsn-install configure -i

# 4. Start services
npm start
```

That's it! The CLI handles everything automatically.

---

## Platform-Specific Instructions

### macOS (10.15+)

#### Prerequisites

Install Homebrew if not already installed:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Automated Installation

```bash
npm run cli:install
exprsn-install install
```

#### Manual Installation

```bash
# Install system dependencies
brew install postgresql@15 redis node@18 ffmpeg

# Start services
brew services start postgresql@15
brew services start redis

# Optional: Elasticsearch
brew install elasticsearch
brew services start elasticsearch

# Install Exprsn
npm install
npm run init
```

---

### Ubuntu (20.04, 22.04, 24.04)

#### Automated Installation

```bash
npm run cli:install
exprsn-install install
```

#### Manual Installation

```bash
# Update package lists
sudo apt update

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -
sudo apt install -y nodejs

# Install PostgreSQL 15
sudo apt install -y postgresql-15 postgresql-contrib

# Install Redis
sudo apt install -y redis-server

# Install FFmpeg and build tools
sudo apt install -y ffmpeg build-essential

# Start services
sudo systemctl start postgresql
sudo systemctl enable postgresql
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Configure PostgreSQL
sudo -u postgres createuser $USER
sudo -u postgres psql -c "ALTER USER $USER WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "ALTER USER $USER CREATEDB;"

# Install Exprsn
npm install
npm run init
```

---

### Debian (11, 12)

#### Automated Installation

```bash
npm run cli:install
exprsn-install install
```

#### Manual Installation

```bash
# Update package lists
sudo apt update

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Redis
sudo apt install -y redis-server

# Install FFmpeg and build tools
sudo apt install -y ffmpeg build-essential

# Start services
sudo systemctl start postgresql
sudo systemctl enable postgresql
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Install Exprsn
npm install
npm run init
```

---

### Fedora (38, 39, 40)

#### Automated Installation

```bash
npm run cli:install
exprsn-install install
```

#### Manual Installation

```bash
# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs

# Install PostgreSQL
sudo dnf install -y postgresql-server postgresql-contrib

# Initialize PostgreSQL
sudo postgresql-setup --initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install Redis
sudo dnf install -y redis

# Start Redis
sudo systemctl start redis
sudo systemctl enable redis

# Install FFmpeg and build tools
sudo dnf install -y ffmpeg gcc-c++ make

# Install Exprsn
npm install
npm run init
```

---

### Arch Linux

#### Automated Installation

```bash
npm run cli:install
exprsn-install install
```

#### Manual Installation

```bash
# Install dependencies
sudo pacman -S postgresql redis nodejs npm ffmpeg base-devel

# Initialize PostgreSQL
sudo -u postgres initdb -D /var/lib/postgres/data

# Start services
sudo systemctl start postgresql
sudo systemctl enable postgresql
sudo systemctl start redis
sudo systemctl enable redis

# Configure PostgreSQL
sudo -u postgres createuser --interactive
sudo -u postgres createdb $USER

# Install Exprsn
npm install
npm run init
```

---

### RHEL/CentOS/Rocky Linux/AlmaLinux (8, 9)

#### Automated Installation

```bash
npm run cli:install
exprsn-install install
```

#### Manual Installation

```bash
# Install EPEL repository
sudo dnf install -y epel-release

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo dnf install -y nodejs

# Install PostgreSQL
sudo dnf install -y postgresql-server postgresql-contrib

# Initialize PostgreSQL
sudo postgresql-setup --initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install Redis
sudo dnf install -y redis

# Start Redis
sudo systemctl start redis
sudo systemctl enable redis

# Install FFmpeg (from RPM Fusion)
sudo dnf install -y https://download1.rpmfusion.org/free/el/rpmfusion-free-release-$(rpm -E %rhel).noarch.rpm
sudo dnf install -y ffmpeg

# Install build tools
sudo dnf groupinstall -y "Development Tools"

# Install Exprsn
npm install
npm run init
```

---

## Manual Installation (All Platforms)

If you prefer not to use the CLI:

### Step 1: Install System Dependencies

**Required:**
- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- FFmpeg
- Build tools (gcc, make, etc.)

**Optional:**
- Elasticsearch 8+ (for Timeline search)

### Step 2: Start Services

Ensure PostgreSQL and Redis are running:

```bash
# Check services (varies by platform)
pg_isready
redis-cli ping
```

### Step 3: Configure PostgreSQL

Create a database user:

```bash
sudo -u postgres createuser $USER
sudo -u postgres psql -c "ALTER USER $USER WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "ALTER USER $USER CREATEDB;"
```

### Step 4: Clone and Install

```bash
# Navigate to Exprsn directory
cd /path/to/exprsn

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Step 5: Initialize System

```bash
# Create databases and run migrations
npm run init

# Or step-by-step:
npm run db:create
npm run migrate:all
npm run seed
```

### Step 6: Start Services

```bash
# Start all services
npm start

# Or start specific services
npm run start:ca
npm run start:auth
npm run start:timeline
```

---

## Post-Installation

### Verify Installation

```bash
# Check system dependencies
exprsn-install check

# Check service status
exprsn-install status

# Or manually
npm run health
```

### Configure Environment

Edit `.env` file:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_ENABLED=true

# Services to auto-start
AUTO_START_SERVICES=ca,setup,timeline,bridge

# Environment
NODE_ENV=development
```

### Test the System

```bash
# Run tests
npm run test:all

# Check health
npm run health:watch
```

### Access Services

- **CA Dashboard**: http://localhost:3000
- **Setup Manager**: http://localhost:3015
- **Auth Service**: http://localhost:3001
- **Business Hub**: http://localhost:5001

---

## Troubleshooting

### Common Issues

#### "Command not found: exprsn-install"

```bash
# Install the CLI
npm run cli:install
```

#### PostgreSQL Connection Failed

```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL (macOS)
brew services start postgresql@15

# Start PostgreSQL (Linux)
sudo systemctl start postgresql
```

#### Redis Connection Failed

```bash
# Check if Redis is running
redis-cli ping

# Start Redis (macOS)
brew services start redis

# Start Redis (Linux)
sudo systemctl start redis
```

#### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

#### Permission Denied (Linux)

Use sudo for system-level operations:

```bash
sudo exprsn-install install
```

#### Node.js Version Too Old

The installer automatically installs Node.js 18+. If needed manually:

```bash
# macOS
brew install node@18

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -
sudo apt install -y nodejs
```

#### Database Initialization Failed

Manually create databases:

```bash
# Create user
sudo -u postgres createuser -s $USER

# Create databases
npm run db:create
```

#### Missing Build Tools

```bash
# Ubuntu/Debian
sudo apt install -y build-essential

# Fedora/RHEL
sudo dnf groupinstall -y "Development Tools"

# Arch
sudo pacman -S base-devel

# macOS (Xcode Command Line Tools)
xcode-select --install
```

### Getting Help

- **Documentation**: See README.md and CLAUDE.md
- **CLI Help**: `exprsn-install --help`
- **Check System**: `exprsn-install check -v`
- **GitHub Issues**: https://github.com/ExprsnIO/Exprsn/issues
- **Email**: engineering@exprsn.com

---

## System Requirements

### Minimum

- **CPU**: 2 cores
- **RAM**: 4 GB
- **Disk**: 10 GB free space
- **OS**: 64-bit

### Recommended

- **CPU**: 4+ cores
- **RAM**: 8+ GB
- **Disk**: 20+ GB (SSD)
- **OS**: Latest LTS version

---

## Next Steps

After successful installation:

1. **Configure Services**: `exprsn-install configure -i`
2. **Start Services**: `npm start`
3. **Access Dashboard**: http://localhost:3000
4. **Read Documentation**: See CLAUDE.md for development guide
5. **Run Tests**: `npm run test:all`

Congratulations! Exprsn is now installed and ready to use. 🎉
