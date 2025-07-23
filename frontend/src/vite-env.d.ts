/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_IC_HOST: string
  readonly VITE_DFX_NETWORK: string
  readonly VITE_ZEROLOCK_BACKEND_CANISTER_ID: string
  readonly VITE_BOUNTY_FACTORY_CANISTER_ID: string
  readonly VITE_VAULT_CANISTER_ID: string
  readonly VITE_JUDGE_CANISTER_ID: string
  readonly VITE_LEADERBOARD_CANISTER_ID: string
  readonly VITE_INTERNET_IDENTITY_URL: string
  readonly VITE_INTERNET_IDENTITY_CANISTER_ID: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly DEV: boolean
  readonly PROD: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}