# Contributing to SpendGuard

SpendGuard is open-source infrastructure for the Stellar ecosystem. We welcome
forks, deployments, and contributions.

## Deploy Your Own Instance

SpendGuard is designed to be fork-friendly. Any developer can deploy their own
spending-policy contract on Stellar in under 10 minutes.

### 1. Clone and build the contract

```bash
git clone https://github.com/deegalabs/stellar-402-spendguard.git
cd stellar-402-spendguard/contracts/budget-guard
cargo build --target wasm32-unknown-unknown --release
cargo test  # 37 tests, all should pass
```

### 2. Create accounts on Stellar Testnet

You need three accounts: **owner**, **agent**, and at least one **merchant**.

```bash
# Generate keypairs (or use Stellar Laboratory)
# Fund each account via https://friendbot.stellar.org?addr=G...
```

### 3. Deploy the contract

```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/budget_guard.wasm \
  --source <OWNER_SECRET_KEY> \
  --network testnet
```

### 4. Initialize with your policies

```bash
stellar contract invoke \
  --id <CONTRACT_ADDRESS> \
  --source <OWNER_SECRET_KEY> \
  --network testnet \
  -- initialize \
  --owner <OWNER_PUBLIC_KEY> \
  --agent <AGENT_PUBLIC_KEY> \
  --usdc_token <USDC_SAC_ADDRESS> \
  --daily_limit 50000000 \
  --max_tx_value 10000000
```

### 5. Run the backend and frontend

```bash
cd backend && cp .env.example .env  # Fill in your keys
npm install && npm run dev

cd frontend && cp .env.example .env.local
npm install && npm run dev
```

See [ENVIRONMENT.md](docs/ENVIRONMENT.md) for all configuration variables.

## Contributing Code

### Prerequisites

- Rust + `wasm32-unknown-unknown` target
- Node.js 20+
- Stellar CLI (`stellar`)

### Development workflow

1. **Spec first** — write or update the relevant spec in `docs/` or `contracts/budget-guard/`
2. **Tests second** — write failing tests that assert the new behavior
3. **Implementation third** — make the tests pass

This follows our [Destructive TDD](docs/TEST_STRATEGY.md) philosophy: tests
must fail on first run. A test that passes without implementation is
documentation, not a test.

### Code conventions

- **Rust**: `snake_case`, explicit `Result<T, Error>`, no `unwrap()` in production
- **TypeScript**: strict mode, no `any`, interfaces for all public types
- **Commits**: `type(scope): description` (feat/docs/test/fix)

### Running tests

```bash
# Contract tests
cd contracts/budget-guard && cargo test

# Backend type check
cd backend && npx tsc --noEmit

# Frontend build
cd frontend && npm run build
```

### What we accept

- Bug fixes with regression tests
- New invariants or attack vector tests
- Documentation improvements
- Performance optimizations with benchmarks

### What requires discussion first

- New contract functions (open an issue with the spec)
- Breaking API changes
- Features outside [TRADE_OFFS.md](TRADE_OFFS.md)

## Architecture

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for system overview and
[DECISIONS.md](docs/DECISIONS.md) for the 7 Architecture Decision Records
explaining trade-offs.

## License

By contributing, you agree that your contributions will be licensed under
Apache 2.0 — see [LICENSE](LICENSE).
