import { describe, it, expect } from 'vitest'
import { userManagementService } from '../../services/userManagementService'
import { server } from '../../test-utils/mocks/server'
import { http, HttpResponse } from 'msw'

const API_BASE_URL = '/api'

describe('userManagementService', () => {
  describe('getUsers', () => {
    it('should return paginated user list', async () => {
      const result = await userManagementService.getUsers({ page: 1, pageSize: 10 })

      expect(result).toBeDefined()
      expect(result.items).toBeDefined()
      expect(Array.isArray(result.items)).toBe(true)
    })

    it('should filter users by role', async () => {
      const result = await userManagementService.getUsers({ role: 'Admin' })

      expect(result.items.every((u) => u.role === 'Admin')).toBe(true)
    })

    it('should filter users by status', async () => {
      const result = await userManagementService.getUsers({ status: 'Active' })

      expect(result.items.every((u) => u.status === 'Active')).toBe(true)
    })

    it('should search users by term', async () => {
      const result = await userManagementService.getUsers({ searchTerm: 'admin' })

      expect(result.items.length).toBeGreaterThan(0)
    })

    it('should throw error on API failure', async () => {
      server.use(
        http.get(`${API_BASE_URL}/usermanagement`, () => {
          return HttpResponse.json({ message: 'Server error' }, { status: 500 })
        })
      )

      await expect(userManagementService.getUsers()).rejects.toThrow()
    })
  })

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const result = await userManagementService.createUser({
        email: 'newuser@test.com',
        firstName: 'New',
        lastName: 'User',
        role: 'StandardUser',
      })

      expect(result).toBeDefined()
      expect(result.email).toBe('newuser@test.com')
      expect(result.status).toBe('Active')
    })

    it('should throw error for duplicate email', async () => {
      await expect(
        userManagementService.createUser({
          email: 'admin@test.com',
          firstName: 'Dup',
          lastName: 'User',
          role: 'Admin',
        })
      ).rejects.toThrow('Email already registered')
    })

    it('should throw error on API failure', async () => {
      server.use(
        http.post(`${API_BASE_URL}/usermanagement/create`, () => {
          return HttpResponse.json({ message: 'Server error' }, { status: 500 })
        })
      )

      await expect(
        userManagementService.createUser({
          email: 'fail@test.com',
          firstName: 'Fail',
          lastName: 'User',
          role: 'StandardUser',
        })
      ).rejects.toThrow()
    })
  })

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const result = await userManagementService.updateUser('2', {
        firstName: 'Updated',
        lastName: 'Name',
      })

      expect(result).toBeDefined()
      expect(result.firstName).toBe('Updated')
    })

    it('should throw error for non-existent user', async () => {
      await expect(
        userManagementService.updateUser('999', { firstName: 'Test' })
      ).rejects.toThrow()
    })
  })

  describe('deactivateUser', () => {
    it('should deactivate user successfully', async () => {
      await expect(
        userManagementService.deactivateUser('2', 'Policy violation')
      ).resolves.toBeUndefined()
    })

    it('should throw error for self-deactivation', async () => {
      await expect(
        userManagementService.deactivateUser('1', 'Self deactivation')
      ).rejects.toThrow('Cannot deactivate your own account')
    })

    it('should throw error for non-existent user', async () => {
      await expect(
        userManagementService.deactivateUser('999', 'Test')
      ).rejects.toThrow()
    })
  })

  describe('reactivateUser', () => {
    it('should reactivate user successfully', async () => {
      await expect(
        userManagementService.reactivateUser('4')
      ).resolves.toBeUndefined()
    })
  })

  describe('approveUser', () => {
    it('should approve pending user successfully', async () => {
      const result = await userManagementService.approveUser('3')

      expect(result).toBeDefined()
      expect(result.status).toBe('Active')
    })

    it('should throw error for non-pending user', async () => {
      await expect(
        userManagementService.approveUser('1')
      ).rejects.toThrow()
    })
  })

  describe('rejectUser', () => {
    it('should reject pending user successfully', async () => {
      await expect(
        userManagementService.rejectUser('3', 'Not eligible')
      ).resolves.toBeUndefined()
    })
  })

  describe('getPendingUsers', () => {
    it('should return pending users', async () => {
      const result = await userManagementService.getPendingUsers()

      expect(Array.isArray(result)).toBe(true)
      expect(result.every((u) => u.status === 'Pending')).toBe(true)
    })
  })

  describe('updateUserRole', () => {
    it('should update user role successfully', async () => {
      await expect(
        userManagementService.updateUserRole('2', 'Admin')
      ).resolves.toBeUndefined()
    })

    it('should throw error for non-existent user', async () => {
      await expect(
        userManagementService.updateUserRole('999', 'Admin')
      ).rejects.toThrow()
    })
  })

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      const result = await userManagementService.getUserById('1')

      expect(result).toBeDefined()
      expect(result.id).toBe('1')
      expect(result.email).toBe('admin@test.com')
    })

    it('should throw error for non-existent user', async () => {
      await expect(
        userManagementService.getUserById('999')
      ).rejects.toThrow()
    })
  })
})
