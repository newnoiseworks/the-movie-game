/** @type {import('ts-jest').JestConfigWithTsJest} */
var dote = require('dotenv').config({
  path: './.env.test'
})

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['./src']
};
