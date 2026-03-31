import { setupServer } from 'msw/node'
import { authHandlers } from './handlers/auth'
import { userManagementHandlers } from './handlers/userManagement'

export const server = setupServer(...authHandlers, ...userManagementHandlers)
