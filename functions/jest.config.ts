import type { Config } from 'jest'
import * as dotenv from 'dotenv'

dotenv.config({ path: './.env.test' })

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['./src'],
  moduleNameMapper: {
    '^axios$': require.resolve('axios'),
  },
  globalSetup: './src/test-setup.ts'
}

export default config
