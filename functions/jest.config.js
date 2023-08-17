/** @type {import('ts-jest').JestConfigWithTsJest} */
require('dotenv').config({
  path: './.env.test'
})

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['./src'],
  moduleNameMapper: {
    '^axios$': require.resolve('axios'),
  },
};
