// Utilidades para manejar llamadas a la API
const API_BASE_URL = '/api'

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  details?: any
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  }

  const response = await fetch(url, { ...defaultOptions, ...options })
  const data = await response.json()

  if (!response.ok) {
    throw new ApiError(
      data.error || 'Error en la solicitud',
      response.status,
      data.details
    )
  }

  return data
}

// Funciones para autenticación
export const authApi = {
  login: async (email: string, password: string) => {
    return apiRequest('/auth', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  logout: async () => {
    return apiRequest('/auth', {
      method: 'DELETE',
    })
  },
}

// Funciones para laboratorios
export const laboratoriesApi = {
  getAll: async () => {
    return apiRequest('/laboratories')
  },

  create: async (data: { name: string; address: string }) => {
    return apiRequest('/laboratories', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update: async (id: string, data: { name: string; address: string }) => {
    return apiRequest('/laboratories', {
      method: 'PUT',
      body: JSON.stringify({ id, ...data }),
    })
  },

  delete: async (id: string) => {
    return apiRequest(`/laboratories?id=${id}`, {
      method: 'DELETE',
    })
  },

  // Máquinas
  getMachines: async (labId: string) => {
    return apiRequest(`/laboratories/${labId}/machines`)
  },

  addMachine: async (labId: string, data: { name: string; type: string; status: 'operativa' | 'no disponible' }) => {
    return apiRequest(`/laboratories/${labId}/machines`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  updateMachine: async (labId: string, machineId: string, data: any) => {
    return apiRequest(`/laboratories/${labId}/machines`, {
      method: 'PUT',
      body: JSON.stringify({ machineId, ...data }),
    })
  },

  deleteMachine: async (labId: string, machineId: string) => {
    return apiRequest(`/laboratories/${labId}/machines?machineId=${machineId}`, {
      method: 'DELETE',
    })
  },
}

// Funciones para clientes
export const clientsApi = {
  getAll: async () => {
    return apiRequest('/clients')
  },

  create: async (data: { name: string; email: string; phone: string }) => {
    return apiRequest('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update: async (id: string, data: { name: string; email: string; phone: string }) => {
    return apiRequest('/clients', {
      method: 'PUT',
      body: JSON.stringify({ id, ...data }),
    })
  },

  delete: async (id: string) => {
    return apiRequest(`/clients?id=${id}`, {
      method: 'DELETE',
    })
  },

  // Pruebas de clientes
  getTests: async (clientId: string) => {
    return apiRequest(`/clients/${clientId}/tests`)
  },

  addTest: async (clientId: string, data: any) => {
    return apiRequest(`/clients/${clientId}/tests`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  updateTest: async (clientId: string, testId: string, data: any) => {
    return apiRequest(`/clients/${clientId}/tests`, {
      method: 'PUT',
      body: JSON.stringify({ testId, ...data }),
    })
  },

  deleteTest: async (clientId: string, testId: string) => {
    return apiRequest(`/clients/${clientId}/tests?testId=${testId}`, {
      method: 'DELETE',
    })
  },
}

// Funciones para chat
export const chatApi = {
  getChannels: async () => {
    return apiRequest('/chat?type=channels')
  },

  getUsers: async () => {
    return apiRequest('/chat?type=users')
  },

  getMessages: async (channelId: string) => {
    return apiRequest(`/chat?channelId=${channelId}`)
  },

  sendMessage: async (data: {
    channelId: string
    userId: string
    userName: string
    userRole: string
    content: string
    type: 'message' | 'system' | 'lab-request'
  }) => {
    return apiRequest('/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  createChannel: async (data: {
    name: string
    type: 'laboratory' | 'general' | 'direct'
    labId?: string
    participants: string[]
  }) => {
    return apiRequest('/chat', {
      method: 'PUT',
      body: JSON.stringify({
        action: 'create_channel',
        ...data
      }),
    })
  },

  deleteChannel: async (channelId: string) => {
    return apiRequest(`/chat?channelId=${channelId}`, {
      method: 'DELETE',
    })
  },

  updateUserStatus: async (userId: string, isOnline: boolean) => {
    return apiRequest('/chat', {
      method: 'PUT',
      body: JSON.stringify({
        action: 'update_user_status',
        userId,
        isOnline
      }),
    })
  },

  cleanupMessages: async () => {
    return apiRequest('/chat?action=cleanup_messages', {
      method: 'DELETE',
    })
  },
}

// Funciones para inventario
export const inventoryApi = {
  getAll: async () => {
    return apiRequest('/inventory')
  },

  getByLab: async (labId: string) => {
    return apiRequest(`/inventory?labId=${labId}`)
  },

  addItem: async (labId: string, data: any) => {
    return apiRequest('/inventory', {
      method: 'POST',
      body: JSON.stringify({ labId, ...data }),
    })
  },

  updateItem: async (labId: string, itemId: string, data: any) => {
    return apiRequest('/inventory', {
      method: 'PUT',
      body: JSON.stringify({ labId, itemId, ...data }),
    })
  },

  deleteItem: async (labId: string, itemId: string) => {
    return apiRequest(`/inventory?labId=${labId}&itemId=${itemId}`, {
      method: 'DELETE',
    })
  },
}

// Funciones para actividades
export const activitiesApi = {
  getAll: async (params?: {
    userId?: string
    category?: string
    limit?: number
    offset?: number
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.userId) searchParams.append('userId', params.userId)
    if (params?.category) searchParams.append('category', params.category)
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.offset) searchParams.append('offset', params.offset.toString())

    const query = searchParams.toString()
    return apiRequest(`/activities${query ? `?${query}` : ''}`)
  },

  create: async (data: {
    userId: string
    userName: string
    userRole: string
    action: string
    description: string
    category: 'authentication' | 'test_management' | 'lab_management' | 'communication' | 'inventory' | 'assignment'
    relatedId?: string
    relatedName?: string
    metadata?: Record<string, any>
  }) => {
    return apiRequest('/activities', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  cleanup: async (days: number = 30) => {
    return apiRequest(`/activities?days=${days}`, {
      method: 'DELETE',
    })
  },
}

// Funciones para usuarios
export const usersApi = {
  getAll: async (params?: {
    role?: string
    labId?: string
    onlineOnly?: boolean
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.role) searchParams.append('role', params.role)
    if (params?.labId) searchParams.append('labId', params.labId)
    if (params?.onlineOnly) searchParams.append('onlineOnly', 'true')

    const query = searchParams.toString()
    return apiRequest(`/users${query ? `?${query}` : ''}`)
  },

  create: async (data: {
    name: string
    role: string
    email: string
    password: string
    labId?: string
    permissions?: string[]
  }) => {
    return apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update: async (id: string, data: any) => {
    return apiRequest('/users', {
      method: 'PUT',
      body: JSON.stringify({ id, ...data }),
    })
  },

  delete: async (id: string) => {
    return apiRequest(`/users?id=${id}`, {
      method: 'DELETE',
    })
  },
}

// Funciones para asignaciones
export const assignmentsApi = {
  getAll: async (params?: {
    technicianId?: string
    status?: string
    testId?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.technicianId) searchParams.append('technicianId', params.technicianId)
    if (params?.status) searchParams.append('status', params.status)
    if (params?.testId) searchParams.append('testId', params.testId)

    const query = searchParams.toString()
    return apiRequest(`/assignments${query ? `?${query}` : ''}`)
  },

  create: async (data: {
    testId: string
    clientTestId?: string
    recordId?: string
    technicianId: string
    technicianName: string
    assignedBy: string
    status: 'asignada' | 'en_proceso' | 'completada'
    notes?: string
  }) => {
    return apiRequest('/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update: async (id: string, data: any) => {
    return apiRequest('/assignments', {
      method: 'PUT',
      body: JSON.stringify({ id, ...data }),
    })
  },

  delete: async (id: string) => {
    return apiRequest(`/assignments?id=${id}`, {
      method: 'DELETE',
    })
  },
}

export { ApiError }
