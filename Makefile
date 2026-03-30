.DEFAULT_GOAL := help

.PHONY: help install dev dev-watch build build-web package lint lint-fix typecheck i18n clean

help: ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

# === Setup ===

install: ## Install dependencies
	pnpm install

# === Development ===

dev: ## Start development server
	pnpm run dev

dev-watch: ## Start dev server with HMR for main/preload
	pnpm run dev:watch

# === Build ===

build: ## Build for production (typecheck + electron + remote)
	pnpm run build

build-web: ## Build standalone web app
	pnpm run build:web

package: ## Package for current platform
	pnpm run package

# === Quality ===

lint: ## Run ESLint and Stylelint
	pnpm run lint

lint-fix: ## Auto-fix lint issues
	pnpm run lint:fix

typecheck: ## Type check all projects
	pnpm run typecheck

# === i18n ===

i18n: ## Generate i18n translation files
	pnpm run i18next

# === Cleanup ===

clean: ## Remove build artifacts and dependencies
	rm -rf dist out node_modules
