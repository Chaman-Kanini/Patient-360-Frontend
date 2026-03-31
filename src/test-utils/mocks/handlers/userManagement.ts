import { http, HttpResponse } from 'msw'

const API_BASE_URL = '/api'

interface MockUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  status: string
  createdAt: string
  lastLoginAt: string | null
  phoneNumber: string | null
  department: string | null
  approvedAt: string | null
  deactivatedAt: string | null
}

const mockUsers: MockUser[] = [
  {
    id: '1',
    email: 'admin@test.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'Admin',
    status: 'Active',
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: '2024-01-15T10:00:00Z',
    phoneNumber: '1234567890',
    department: 'IT',
    approvedAt: '2024-01-01T00:00:00Z',
    deactivatedAt: null,
  },
  {
    id: '2',
    email: 'user@test.com',
    firstName: 'Standard',
    lastName: 'User',
    role: 'StandardUser',
    status: 'Active',
    createdAt: '2024-01-02T00:00:00Z',
    lastLoginAt: '2024-01-14T09:00:00Z',
    phoneNumber: '9876543210',
    department: 'HR',
    approvedAt: '2024-01-02T00:00:00Z',
    deactivatedAt: null,
  },
  {
    id: '3',
    email: 'pending@test.com',
    firstName: 'Pending',
    lastName: 'User',
    role: 'StandardUser',
    status: 'Pending',
    createdAt: '2024-01-10T00:00:00Z',
    lastLoginAt: null,
    phoneNumber: null,
    department: null,
    approvedAt: null,
    deactivatedAt: null,
  },
  {
    id: '4',
    email: 'inactive@test.com',
    firstName: 'Inactive',
    lastName: 'User',
    role: 'StandardUser',
    status: 'Inactive',
    createdAt: '2024-01-03T00:00:00Z',
    lastLoginAt: '2024-01-10T08:00:00Z',
    phoneNumber: '5555555555',
    department: 'Finance',
    approvedAt: '2024-01-03T00:00:00Z',
    deactivatedAt: '2024-01-12T00:00:00Z',
  },
]

function createMockUser(overrides?: Partial<MockUser>): MockUser {
  return {
    id: '999',
    email: 'mock@test.com',
    firstName: 'Mock',
    lastName: 'User',
    role: 'StandardUser',
    status: 'Active',
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: null,
    phoneNumber: null,
    department: null,
    approvedAt: '2024-01-01T00:00:00Z',
    deactivatedAt: null,
    ...overrides,
  }
}

export const userManagementHandlers = [
  // Get users with pagination and filtering
  http.get(`${API_BASE_URL}/usermanagement`, ({ request }) => {
    const url = new URL(request.url)
    const searchTerm = url.searchParams.get('searchTerm')
    const role = url.searchParams.get('role')
    const status = url.searchParams.get('status')
    const page = parseInt(url.searchParams.get('page') || '1')
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10')

    let filteredUsers = [...mockUsers]

    if (searchTerm) {
      filteredUsers = filteredUsers.filter(
        (u) =>
          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.lastName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (role) {
      filteredUsers = filteredUsers.filter((u) => u.role === role)
    }

    if (status) {
      filteredUsers = filteredUsers.filter((u) => u.status === status)
    }

    const totalCount = filteredUsers.length
    const totalPages = Math.ceil(totalCount / pageSize)
    const startIndex = (page - 1) * pageSize
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize)

    return HttpResponse.json({
      items: paginatedUsers,
      totalCount,
      currentPage: page,
      pageSize,
      totalPages,
    })
  }),

  // Get pending users (must be before /:id to avoid route conflict)
  http.get(`${API_BASE_URL}/usermanagement/pending`, () => {
    const pendingUsers = mockUsers.filter((u) => u.status === 'Pending')
    return HttpResponse.json(pendingUsers)
  }),

  // Get user by ID
  http.get(`${API_BASE_URL}/usermanagement/:id`, ({ params }) => {
    const { id } = params
    const user = mockUsers.find((u) => u.id === id)

    if (!user) {
      return HttpResponse.json({ message: 'User not found' }, { status: 404 })
    }

    return HttpResponse.json(user)
  }),

  // Create user
  http.post(`${API_BASE_URL}/usermanagement/create`, async ({ request }) => {
    const body = (await request.json()) as Record<string, string>

    if (mockUsers.some((u) => u.email === body.email)) {
      return HttpResponse.json({ message: 'Email already registered' }, { status: 400 })
    }

    const newUser = createMockUser({
      id: `${mockUsers.length + 1}`,
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      role: body.role,
      phoneNumber: body.phoneNumber,
      department: body.department,
      status: 'Active',
    })

    return HttpResponse.json(newUser, { status: 201 })
  }),

  // Update user
  http.put(`${API_BASE_URL}/usermanagement/:id`, async ({ params, request }) => {
    const { id } = params
    const body = (await request.json()) as Record<string, string>
    const user = mockUsers.find((u) => u.id === id)

    if (!user) {
      return HttpResponse.json({ message: 'User not found' }, { status: 404 })
    }

    const updatedUser = {
      ...user,
      firstName: body.firstName || user.firstName,
      lastName: body.lastName || user.lastName,
      phoneNumber: body.phoneNumber || user.phoneNumber,
      department: body.department || user.department,
    }

    return HttpResponse.json(updatedUser)
  }),

  // Update user role
  http.put(`${API_BASE_URL}/usermanagement/:id/role`, async ({ params, request }) => {
    const { id } = params
    const body = (await request.json()) as Record<string, string>
    const user = mockUsers.find((u) => u.id === id)

    if (!user) {
      return HttpResponse.json({ message: 'User not found' }, { status: 404 })
    }

    if (user.id === '1' && body.role !== 'Admin') {
      return HttpResponse.json(
        { message: 'Cannot remove admin role from the last admin account' },
        { status: 400 }
      )
    }

    return HttpResponse.json({ success: true })
  }),

  // Deactivate user
  http.post(`${API_BASE_URL}/usermanagement/:id/deactivate`, async ({ params }) => {
    const { id } = params
    const user = mockUsers.find((u) => u.id === id)

    if (!user) {
      return HttpResponse.json({ message: 'User not found' }, { status: 404 })
    }

    const currentUserId = '1'
    if (id === currentUserId) {
      return HttpResponse.json({ message: 'Cannot deactivate your own account' }, { status: 400 })
    }

    if (
      user.role === 'Admin' &&
      mockUsers.filter((u) => u.role === 'Admin' && u.status === 'Active').length === 1
    ) {
      return HttpResponse.json({ message: 'Cannot deactivate the last admin account' }, { status: 400 })
    }

    return HttpResponse.json({ success: true })
  }),

  // Reactivate user
  http.post(`${API_BASE_URL}/usermanagement/:id/reactivate`, ({ params }) => {
    const { id } = params
    const user = mockUsers.find((u) => u.id === id)

    if (!user) {
      return HttpResponse.json({ message: 'User not found' }, { status: 404 })
    }

    return HttpResponse.json({ success: true })
  }),

  // Approve user
  http.post(`${API_BASE_URL}/usermanagement/:id/approve`, ({ params }) => {
    const { id } = params
    const user = mockUsers.find((u) => u.id === id)

    if (!user) {
      return HttpResponse.json({ message: 'User not found' }, { status: 404 })
    }

    if (user.status !== 'Pending') {
      return HttpResponse.json({ message: 'User is not pending approval' }, { status: 400 })
    }

    const approvedUser = {
      ...user,
      status: 'Active',
      approvedAt: new Date().toISOString(),
    }

    return HttpResponse.json(approvedUser)
  }),

  // Reject user
  http.post(`${API_BASE_URL}/usermanagement/:id/reject`, async ({ params }) => {
    const { id } = params
    const user = mockUsers.find((u) => u.id === id)

    if (!user) {
      return HttpResponse.json({ message: 'User not found' }, { status: 404 })
    }

    if (user.status !== 'Pending') {
      return HttpResponse.json({ message: 'User is not pending approval' }, { status: 400 })
    }

    return HttpResponse.json({ success: true })
  }),

  // Registration
  http.post(`${API_BASE_URL}/registration/register`, async ({ request }) => {
    const body = (await request.json()) as Record<string, string>

    if (mockUsers.some((u) => u.email.toLowerCase() === body.email.toLowerCase())) {
      return HttpResponse.json(
        { success: false, message: 'Email is already registered' },
        { status: 400 }
      )
    }

    if (body.password !== body.confirmPassword) {
      return HttpResponse.json(
        { success: false, message: 'Password and confirmation do not match' },
        { status: 400 }
      )
    }

    const isPasswordComplex = (password: string) => {
      if (password.length < 8) return false
      return /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
    }

    if (!isPasswordComplex(body.password)) {
      return HttpResponse.json(
        {
          success: false,
          message: 'Password does not meet complexity requirements.',
        },
        { status: 400 }
      )
    }

    const newUser = createMockUser({
      id: `${mockUsers.length + 1}`,
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      phoneNumber: body.phoneNumber,
      department: body.department,
      status: 'Pending',
    })

    return HttpResponse.json({
      success: true,
      message: 'Registration submitted successfully. Your account is pending approval.',
      user: newUser,
    })
  }),

  // Check email availability
  http.get(`${API_BASE_URL}/registration/check-email`, ({ request }) => {
    const url = new URL(request.url)
    const email = url.searchParams.get('email')

    if (!email) {
      return HttpResponse.json({ available: false }, { status: 400 })
    }

    const available = !mockUsers.some((u) => u.email.toLowerCase() === email.toLowerCase())
    return HttpResponse.json({ available })
  }),
]
