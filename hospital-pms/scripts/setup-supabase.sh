#!/bin/bash

# Supabase Project Setup Script
# This script helps initialize and configure Supabase for different environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "ℹ $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to prompt for input with default value
prompt_with_default() {
    local prompt="$1"
    local default="$2"
    local input
    
    read -p "$prompt [$default]: " input
    echo "${input:-$default}"
}

# Function to setup environment file
setup_env_file() {
    local env_name="$1"
    local env_file="$2"
    
    echo
    echo "Setting up $env_name environment..."
    echo "================================="
    
    # Check if env file exists
    if [ ! -f "$env_file" ]; then
        print_error "$env_file not found!"
        return 1
    fi
    
    # Prompt for Supabase credentials
    echo "Enter Supabase credentials for $env_name:"
    
    local project_ref=$(prompt_with_default "Project Reference ID" "your-$env_name-project-ref")
    local supabase_url="https://${project_ref}.supabase.co"
    local anon_key=$(prompt_with_default "Anonymous Key" "your-$env_name-anon-key")
    local service_key=$(prompt_with_default "Service Role Key" "your-$env_name-service-role-key")
    
    # Update env file
    sed -i.bak \
        -e "s|NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=$supabase_url|" \
        -e "s|NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=$anon_key|" \
        -e "s|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$service_key|" \
        "$env_file"
    
    print_success "$env_name environment configured!"
}

# Main script
echo "🏥 Hospital Management System - Supabase Setup"
echo "=============================================="
echo

# Check for Node.js
if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check for npx
if ! command_exists npx; then
    print_error "npx is not available. Please ensure npm is properly installed."
    exit 1
fi

# Check Supabase CLI
print_info "Checking Supabase CLI..."
if npx supabase --version >/dev/null 2>&1; then
    SUPABASE_VERSION=$(npx supabase --version)
    print_success "Supabase CLI found: v$SUPABASE_VERSION"
else
    print_error "Supabase CLI not found!"
    exit 1
fi

# Initialize Supabase if not already initialized
if [ ! -f "supabase/config.toml" ]; then
    print_info "Initializing Supabase..."
    npx supabase init
    print_success "Supabase initialized!"
else
    print_success "Supabase already initialized!"
fi

# Create migration directories if they don't exist
print_info "Setting up directory structure..."
mkdir -p supabase/migrations
mkdir -p supabase/functions
mkdir -p supabase/seed
mkdir -p docs
print_success "Directory structure ready!"

# Setup environments
echo
print_info "Choose which environments to configure:"
echo "1) Development only"
echo "2) Staging only"
echo "3) Production only"
echo "4) All environments"
echo "5) Skip environment setup"

read -p "Select option (1-5): " env_choice

case $env_choice in
    1)
        setup_env_file "development" ".env.local"
        ;;
    2)
        setup_env_file "staging" ".env.staging"
        ;;
    3)
        setup_env_file "production" ".env.production"
        ;;
    4)
        setup_env_file "development" ".env.local"
        setup_env_file "staging" ".env.staging"
        setup_env_file "production" ".env.production"
        ;;
    5)
        print_info "Skipping environment setup"
        ;;
    *)
        print_error "Invalid option"
        exit 1
        ;;
esac

# Link to Supabase project
echo
read -p "Do you want to link to a Supabase project now? (y/n): " link_choice
if [[ "$link_choice" =~ ^[Yy]$ ]]; then
    read -p "Enter project reference ID: " project_ref
    print_info "Linking to Supabase project..."
    npx supabase link --project-ref "$project_ref"
    print_success "Project linked!"
    
    # Pull remote schema
    read -p "Pull remote database schema? (y/n): " pull_choice
    if [[ "$pull_choice" =~ ^[Yy]$ ]]; then
        print_info "Pulling remote schema..."
        npx supabase db pull
        print_success "Schema pulled!"
    fi
fi

# Generate TypeScript types
echo
read -p "Generate TypeScript types? (y/n): " types_choice
if [[ "$types_choice" =~ ^[Yy]$ ]]; then
    print_info "Generating TypeScript types..."
    mkdir -p src/types
    npx supabase gen types typescript --local > src/types/database.types.ts
    print_success "TypeScript types generated at src/types/database.types.ts!"
fi

# Create initial migration
echo
read -p "Create initial migration? (y/n): " migration_choice
if [[ "$migration_choice" =~ ^[Yy]$ ]]; then
    read -p "Migration name: " migration_name
    npx supabase migration new "$migration_name"
    print_success "Migration created!"
    print_info "Edit the migration file in supabase/migrations/"
fi

# Setup script complete
echo
echo "=========================================="
print_success "Supabase setup complete!"
echo
echo "Next steps:"
echo "1. Update your .env files with actual Supabase credentials"
echo "2. Create your database schema migrations"
echo "3. Run 'npm run supabase:push' to apply migrations"
echo "4. Generate TypeScript types with 'npm run supabase:types'"
echo
echo "Useful commands:"
echo "  npx supabase status       - Check connection status"
echo "  npx supabase db push      - Push local migrations"
echo "  npx supabase db reset     - Reset local database"
echo "  npx supabase migration new - Create new migration"
echo
print_info "See docs/SUPABASE_SETUP.md for detailed documentation"