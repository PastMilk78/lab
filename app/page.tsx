"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertTriangle, Loader2 } from "lucide-react"
import { ActivityIcon, ChevronDown, ChevronRight, Edit, LogOut, Moon, Plus, Sun, Trash2, Users, X } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { authApi, activitiesApi, laboratoriesApi, clientsApi, chatApi, ApiError } from "@/lib/api"

interface Parameter {
  id: string
  name: string
  value: string
  unit: string
  referenceMin: number
  referenceMax: number
  status: "normal" | "high" | "low"
}

interface TestRecord {
  id: string
  testName: string
  clientId?: string
  clientName?: string
  date: string
  parameters: Parameter[]
  status: "ordenada" | "en_proceso" | "completada" | "enviada"
  notes?: string
  assignedTo?: string
  assignedBy?: string
  assignedDate?: string
}

interface Machine {
  id: string
  name: string
  type: string
  status: "operativa" | "no disponible"
  records: TestRecord[]
}

interface InventoryItem {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  minStock: number
  expirationDate: string
  supplier: string
  notes: string
  status: "disponible" | "bajo_stock" | "agotado" | "vencido"
}

interface Laboratory {
  id: string
  name: string
  address: string
  machines: Machine[]
  inventory: InventoryItem[]
}

interface Test {
  id: string
  name: string
  machineId: string
  machineName: string
  labId: string
  labName: string
  parameters: string[]
}

interface ClientTest {
  id: string
  testId: string
  testName: string
  clientId: string
  orderDate: string
  status: "ordenada" | "en_proceso" | "completada" | "enviada"
  results?: Parameter[]
  notes?: string
  assignedTo?: string
  assignedBy?: string
  assignedDate?: string
}

interface Client {
  id: string
  name: string
  email: string
  phone: string
  tests: ClientTest[]
}

interface InterLabRequest {
  id: string
  fromLabId: string
  toLabId: string
  fromLabName: string
  toLabName: string
  testType: string
  clientName: string
  priority: "normal" | "urgent" | "critical"
  status: "pending" | "accepted" | "rejected" | "completed"
  requestedBy: string
  notes: string
  timestamp: string
}

interface ChatMessage {
  id: string
  channelId: string
  userId: string
  userName: string
  userRole: string
  content: string
  timestamp: string
  type: "message" | "system" | "lab-request"
  labRequest?: InterLabRequest
}

interface ChatChannel {
  id: string
  name: string
  type: "laboratory" | "general" | "direct"
  labId?: string
  participants: string[]
  lastMessage?: ChatMessage
}

interface ChatUser {
  id: string
  name: string
  role: string
  labId?: string
  isOnline: boolean
  email: string
  password: string
  permissions: string[]
}

interface TechnicianAssignment {
  id: string
  testId: string
  clientTestId?: string
  recordId?: string
  technicianId: string
  technicianName: string
  assignedBy: string
  assignedDate: string
  status: "asignada" | "en_proceso" | "completada"
  notes?: string
}

interface Activity {
  id: string
  userId: string
  userName: string
  userRole: string
  action: string
  description: string
  timestamp: string
  category: "authentication" | "test_management" | "lab_management" | "communication" | "inventory" | "assignment"
  relatedId?: string
  relatedName?: string
  metadata?: Record<string, any>
}

interface AuthState {
  isAuthenticated: boolean
  currentUser: ChatUser | null
  loginAttempts: number
  lastLoginAttempt: number
}

const adminPermissions = [
  "manage_labs",
  "manage_users",
  "view_all",
  "assign_tests",
  "manage_inventory",
  "delete_labs",
  "delete_machines",
  "manage_permissions",
  "view_activities",
  "system_admin",
]

const rolePermissions = {
  Admin: [
    "manage_labs",
    "manage_users",
    "view_all",
    "assign_tests",
    "manage_inventory",
    "delete_labs",
    "delete_machines",
    "manage_permissions",
    "view_activities",
    "system_admin",
  ],
  "Jefe de Lab": ["manage_labs", "view_all", "assign_tests", "manage_inventory", "view_activities"],
  Técnico: ["view_assigned", "update_tests", "view_inventory"],
  Patóloga: ["view_results", "approve_tests", "view_all"],
}

const initialChatUsers: ChatUser[] = [
  {
    id: "admin-1",
    name: "Dr. Ana García",
    role: "Admin",
    email: "admin@alquimist.com",
    password: "admin123",
    permissions: adminPermissions,
    isOnline: true,
    labId: "lab-1",
  },
  {
    id: "jefe-1",
    name: "Dr. Carlos Mendez",
    role: "Jefe de Lab",
    email: "jefe@alquimist.com",
    password: "jefe123",
    permissions: rolePermissions["Jefe de Lab"],
    isOnline: true,
    labId: "lab-1",
  },
  {
    id: "tecnico-1",
    name: "María López",
    role: "Técnico",
    email: "tecnico@alquimist.com",
    password: "tecnico123",
    permissions: rolePermissions["Técnico"],
    isOnline: true,
    labId: "lab-1",
  },
  {
    id: "patologa-1",
    name: "Dra. Elena Ruiz",
    role: "Patóloga",
    email: "patologa@alquimist.com",
    password: "patologa123",
    permissions: rolePermissions["Patóloga"],
    isOnline: false,
    labId: "lab-2",
  },
]

const initialData: Laboratory[] = [
  {
    id: "1",
    name: "Lab Central Norte",
    address: "Av. Principal 123, Ciudad",
    machines: [
      {
        id: "1-1",
        name: "Analizador Hematológico",
        type: "Hematología",
        status: "operativa",
        records: [
          {
            id: "1-1-1",
            testName: "Hemograma Completo",
            date: "2024-01-15",
            parameters: [
              {
                id: "p1",
                name: "Hemoglobina",
                value: "14.2",
                unit: "g/dL",
                referenceMin: 12.0,
                referenceMax: 16.0,
                status: "normal",
              },
            ],
            status: "completada",
            notes: "Paciente en ayunas",
          },
        ],
      },
    ],
    inventory: [
      {
        id: "inv-1",
        name: "Tubos de ensayo",
        category: "Material de laboratorio",
        quantity: 150,
        unit: "unidades",
        minStock: 50,
        expirationDate: "2025-12-31",
        supplier: "LabSupply Co.",
        notes: "Tubos de vidrio estándar",
        status: "disponible",
      },
    ],
  },
]

const initialClients: Client[] = [
  {
    id: "1",
    name: "Juan Pérez",
    email: "juan@email.com",
    phone: "555-0123",
    tests: [
      {
        id: "ct1",
        testId: "t1",
        testName: "Hemograma Completo",
        clientId: "1",
        orderDate: "2024-01-15",
        status: "completada",
        results: [
          {
            id: "p1",
            name: "Hemoglobina",
            value: "14.2",
            unit: "g/dL",
            referenceMin: 12.0,
            referenceMax: 16.0,
            status: "normal",
          },
        ],
      },
    ],
  },
]

function LoginScreen({
  onLogin,
  loginError,
  isLoading,
}: {
  onLogin: (email: string, password: string) => void
  loginError: string
  isLoading: boolean
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onLogin(email, password)
  }

  const demoCredentials = [
    { role: "Admin", email: "admin@alquimist.com", password: "admin123" },
    { role: "Jefe de Lab", email: "jefe@alquimist.com", password: "jefe123" },
    { role: "Técnico", email: "tecnico@alquimist.com", password: "tecnico123" },
    { role: "Patóloga", email: "patologa@alquimist.com", password: "patologa123" },
  ]

  return (
    <div className="min-h-screen medical-gradient flex items-center justify-center p-4">
      <Card className="w-full max-w-md border border-border shadow-xl bg-card">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <img src="/alquimist-logo.png" alt="ALQUIMIST Logo" className="h-16 w-auto" />
          </div>
          <CardTitle className="text-2xl font-serif font-bold text-card-foreground">Laboratorios Alquimistas</CardTitle>
          <p className="text-sm text-accent font-medium">Sistema de Gestión</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@alquimist.com"
                required
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Contraseña</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="mt-1"
              />
            </div>
            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {loginError}
                </p>
              </div>
            )}

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-medium text-blue-800 mb-2">Credenciales de Prueba:</p>
              <div className="space-y-1">
                {demoCredentials.map((cred, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setEmail(cred.email)
                      setPassword(cred.password)
                    }}
                    className="w-full text-left p-2 text-xs bg-white rounded border hover:bg-blue-50 transition-colors"
                  >
                    <span className="font-medium text-blue-700">{cred.role}:</span>
                    <br />
                    <span className="text-gray-600">{cred.email}</span> /{" "}
                    <span className="text-gray-600">{cred.password}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LabManagement() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    currentUser: null,
    loginAttempts: 0,
    lastLoginAttempt: 0,
  })
  const [loginError, setLoginError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const [laboratories, setLaboratories] = useState<Laboratory[]>(initialData)
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [activeTab, setActiveTab] = useState("laboratories")
  const [breadcrumb, setBreadcrumb] = useState<string[]>(["Laboratorios"])
  const [expandedLab, setExpandedLab] = useState<string | null>(null)
  const [expandedMachine, setExpandedMachine] = useState<string | null>(null)
  const [editingRecord, setEditingRecord] = useState<TestRecord | null>(null)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [editingLab, setEditingLab] = useState<Laboratory | null>(null)
  const [editingMachine, setEditingMachine] = useState<{ machine: Machine; labId: string } | null>(null)
  const [showInventory, setShowInventory] = useState<string | null>(null)
  const [editingInventoryItem, setEditingInventoryItem] = useState<{ item: InventoryItem; labId: string } | null>(null)
  const [expandedInventoryGroups, setExpandedInventoryGroups] = useState<Record<string, boolean>>({})
  const [selectedInventoryLab, setSelectedInventoryLab] = useState<string | null>(null)
  const [showTestAssignment, setShowTestAssignment] = useState(false)
  const [testAssignment, setTestAssignment] = useState({
    clientId: "",
    testType: "",
    assignedLab: "",
    externalLab: "",
    priority: "normal",
    notes: "",
    assignedTechnician: "",
  })
  const [isDarkMode, setIsDarkMode] = useState(false)

  const [chatUsers, setChatUsers] = useState<ChatUser[]>(initialChatUsers)
  const [activities, setActivities] = useState<Activity[]>([])
  const [editingUser, setEditingUser] = useState<ChatUser | null>(null)
  const [showUsers, setShowUsers] = useState(false)
  const [showActivities, setShowActivities] = useState(false)

  const [chatChannels, setChatChannels] = useState<ChatChannel[]>([
    { id: "general", name: "General", type: "general", participants: [], lastMessage: undefined },
    { id: "inter-lab", name: "Inter-Lab", type: "general", participants: [], lastMessage: undefined },
  ])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "msg1",
      channelId: "general",
      userId: "admin-1",
      userName: "Dr. Ana García",
      userRole: "Admin",
      content: "¡Bienvenidos al sistema de chat interno!",
      timestamp: new Date().toISOString(),
      type: "message",
    },
  ])
  const [selectedChannel, setSelectedChannel] = useState<string>("general")
  const [activeChannel, setActiveChannel] = useState("general")
  const [newMessage, setNewMessage] = useState("")
  const [newChannelName, setNewChannelName] = useState("")
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [technicianAssignments, setTechnicianAssignments] = useState<TechnicianAssignment[]>([])
  const [isLoadingLabs, setIsLoadingLabs] = useState(false)
  const [isLoadingClients, setIsLoadingClients] = useState(false)
  const [isLoadingChat, setIsLoadingChat] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  // Cargar datos desde la API al iniciar
  useEffect(() => {
    if (authState.isAuthenticated) {
      loadLaboratories()
      loadClients()
      loadChatData()
      updateUserOnlineStatus(true)
    }
  }, [authState.isAuthenticated])

  // Actualizar estado offline al salir
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (authState.currentUser) {
        updateUserOnlineStatus(false)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [authState.currentUser])

  // Sincronización en tiempo real del chat
  useEffect(() => {
    if (!authState.isAuthenticated || !selectedChannel) return

    const syncInterval = setInterval(async () => {
      setIsSyncing(true)
      try {
        // Sincronizar mensajes del canal actual
        const messagesResponse = await chatApi.getMessages(selectedChannel)
        if (messagesResponse.success && messagesResponse.data) {
          setChatMessages(messagesResponse.data)
          localStorage.setItem('chat_messages', JSON.stringify(messagesResponse.data))
        }

        // Sincronizar usuarios online
        const usersResponse = await chatApi.getUsers()
        if (usersResponse.success && usersResponse.data) {
          setChatUsers(usersResponse.data)
          localStorage.setItem('chat_users', JSON.stringify(usersResponse.data))
        }

        // Sincronizar canales
        const channelsResponse = await chatApi.getChannels()
        if (channelsResponse.success && channelsResponse.data) {
          setChatChannels(channelsResponse.data)
          localStorage.setItem('chat_channels', JSON.stringify(channelsResponse.data))
        }
      } catch (error) {
        console.error('Error sincronizando chat:', error)
      } finally {
        setIsSyncing(false)
      }
    }, 2000) // Sincronizar cada 2 segundos

    return () => clearInterval(syncInterval)
  }, [authState.isAuthenticated, selectedChannel])

  const loadLaboratories = async () => {
    setIsLoadingLabs(true)
    try {
      const response = await laboratoriesApi.getAll()
      if (response.success && response.data) {
        setLaboratories(response.data)
      }
    } catch (error) {
      console.error('Error cargando laboratorios:', error)
      // Mantener datos locales como fallback
    } finally {
      setIsLoadingLabs(false)
    }
  }

  const loadClients = async () => {
    setIsLoadingClients(true)
    try {
      const response = await clientsApi.getAll()
      if (response.success && response.data) {
        setClients(response.data)
      }
    } catch (error) {
      console.error('Error cargando clientes:', error)
      // Mantener datos locales como fallback
    } finally {
      setIsLoadingClients(false)
    }
  }

  const loadChatData = async () => {
    setIsLoadingChat(true)
    try {
      // Intentar cargar desde cache local primero
      const cachedChannels = localStorage.getItem('chat_channels')
      const cachedUsers = localStorage.getItem('chat_users')
      const cachedMessages = localStorage.getItem('chat_messages')

      if (cachedChannels && cachedUsers) {
        try {
          setChatChannels(JSON.parse(cachedChannels))
          setChatUsers(JSON.parse(cachedUsers))
          if (cachedMessages) {
            setChatMessages(JSON.parse(cachedMessages))
          }
        } catch (e) {
          console.log('Cache corrupto, cargando desde servidor...')
        }
      }

      // Cargar datos frescos del servidor
      const [channelsResponse, usersResponse] = await Promise.all([
        chatApi.getChannels(),
        chatApi.getUsers()
      ])

      if (channelsResponse.success && channelsResponse.data) {
        setChatChannels(channelsResponse.data)
        localStorage.setItem('chat_channels', JSON.stringify(channelsResponse.data))
      }

      if (usersResponse.success && usersResponse.data) {
        setChatUsers(usersResponse.data)
        localStorage.setItem('chat_users', JSON.stringify(usersResponse.data))
      }

      // Cargar mensajes del canal actual
      if (selectedChannel) {
        const messagesResponse = await chatApi.getMessages(selectedChannel)
        if (messagesResponse.success && messagesResponse.data) {
          setChatMessages(messagesResponse.data)
          localStorage.setItem('chat_messages', JSON.stringify(messagesResponse.data))
        }
      }
    } catch (error) {
      console.error('Error cargando datos del chat:', error)
    } finally {
      setIsLoadingChat(false)
    }
  }

  const updateUserOnlineStatus = async (isOnline: boolean) => {
    if (!authState.currentUser) return

    try {
      await chatApi.updateUserStatus(authState.currentUser.id, isOnline)
      // Recargar usuarios para actualizar el estado
      const usersResponse = await chatApi.getUsers()
      if (usersResponse.success && usersResponse.data) {
        setChatUsers(usersResponse.data)
        localStorage.setItem('chat_users', JSON.stringify(usersResponse.data))
      }
    } catch (error) {
      console.error('Error actualizando estado de usuario:', error)
    }
  }

  const clearChatCache = () => {
    localStorage.removeItem('chat_channels')
    localStorage.removeItem('chat_users')
    localStorage.removeItem('chat_messages')
    console.log('🧹 Cache del chat limpiado')
  }

  const logActivity = (
    action: string,
    description: string,
    category: Activity["category"],
    relatedId?: string,
    relatedName?: string,
    metadata?: Record<string, any>,
  ) => {
    if (!authState.currentUser) return

    const activity: Activity = {
      id: `activity-${Date.now()}`,
      userId: authState.currentUser.id,
      userName: authState.currentUser.name,
      userRole: authState.currentUser.role,
      action,
      description,
      timestamp: new Date().toISOString(),
      category,
      relatedId,
      relatedName,
      metadata,
    }

    setActivities((prev) => [activity, ...prev])
  }

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true)
    setLoginError("")

    const now = Date.now()
    if (authState.loginAttempts >= 3 && now - authState.lastLoginAttempt < 300000) {
      setLoginError("Demasiados intentos fallidos. Intenta de nuevo en 5 minutos.")
      setIsLoading(false)
      return
    }

    try {
      const response = await authApi.login(email, password)
      
      if (response.success && response.user) {
        setAuthState({
          isAuthenticated: true,
          currentUser: response.user,
          loginAttempts: 0,
          lastLoginAttempt: 0,
        })
        setLoginError("")

        // Registrar actividad de login
        try {
          await activitiesApi.create({
            userId: response.user.id,
            userName: response.user.name,
            userRole: response.user.role,
            action: "login",
            description: `${response.user.name} inició sesión en el sistema`,
            category: "authentication"
          })
        } catch (error) {
          console.warn("No se pudo registrar la actividad de login:", error)
        }
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setLoginError(error.message)
      } else {
        setLoginError("Error de conexión. Intenta de nuevo.")
      }
      
      setAuthState((prev) => ({
        ...prev,
        loginAttempts: prev.loginAttempts + 1,
        lastLoginAttempt: now,
      }))
    }

    setIsLoading(false)
  }

  const handleLogout = async () => {
    if (authState.currentUser) {
      // Registrar actividad de logout
      try {
        await activitiesApi.create({
          userId: authState.currentUser.id,
          userName: authState.currentUser.name,
          userRole: authState.currentUser.role,
          action: "logout",
          description: `${authState.currentUser.name} cerró sesión`,
          category: "authentication"
        })
      } catch (error) {
        console.warn("No se pudo registrar la actividad de logout:", error)
      }

      // Llamar a la API de logout
      try {
        await authApi.logout()
      } catch (error) {
        console.warn("Error en logout API:", error)
      }
    }

    setAuthState({
      isAuthenticated: false,
      currentUser: null,
      loginAttempts: 0,
      lastLoginAttempt: 0,
    })
    setActiveTab("laboratories")
    setBreadcrumb(["Laboratorios"])
    setExpandedLab(null)
    setExpandedMachine(null)
  }

  const hasPermission = (permission: string): boolean => {
    if (authState.currentUser?.role === "Admin") return true
    return authState.currentUser?.permissions.includes(permission) || false
  }

  const canPerformCriticalAction = (action: string): boolean => {
    if (authState.currentUser?.role !== "Admin") return false
    return true
  }

  const canViewTab = (tab: string): boolean => {
    if (!authState.currentUser) return false

    switch (tab) {
      case "laboratories":
        return true
      case "clients":
        return true
      case "chat":
        return true
      case "admin":
        return hasPermission("system_admin")
      default:
        return false
    }
  }

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev)
  }

  const deleteLaboratory = async (labId: string) => {
    try {
      await laboratoriesApi.delete(labId)
      setLaboratories((prev) => prev.filter((lab) => lab.id !== labId))
      logActivity("delete_lab", `Eliminó el laboratorio con ID ${labId}`, "lab_management", labId)
    } catch (error) {
      console.error('Error eliminando laboratorio:', error)
      alert('Error al eliminar el laboratorio')
    }
  }

  const deleteMachine = (labId: string, machineId: string) => {
    setLaboratories((prev) =>
      prev.map((lab) => ({
        ...lab,
        machines: lab.id === labId ? lab.machines.filter((machine) => machine.id !== machineId) : lab.machines,
      })),
    )
    logActivity(
      "delete_machine",
      `Eliminó la máquina con ID ${machineId} en el laboratorio ${labId}`,
      "lab_management",
      machineId,
    )
  }

  const deleteUser = (userId: string) => {
    if (userId === authState.currentUser?.id) {
      alert("No puedes eliminarte a ti mismo")
      return
    }
    setChatUsers((prev) => prev.filter((user) => user.id !== userId))
    logActivity("delete_user", `Eliminó el usuario con ID ${userId}`, "lab_management", userId)
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !authState.currentUser) return

    const tempMessage = {
      id: `temp-${Date.now()}`,
      channelId: activeChannel,
      userId: authState.currentUser.id,
      userName: authState.currentUser.name,
      userRole: authState.currentUser.role,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      type: "message" as const,
    }

    // Agregar mensaje inmediatamente al estado local
    setChatMessages((prev) => [...prev, tempMessage])
    setNewMessage("")

    try {
      const response = await chatApi.sendMessage({
        channelId: activeChannel,
        userId: authState.currentUser.id,
        userName: authState.currentUser.name,
        userRole: authState.currentUser.role,
        content: newMessage.trim(),
        type: "message",
      })

      if (response.success && response.data) {
        // Reemplazar mensaje temporal con el real del servidor
        setChatMessages((prev) => 
          prev.map(msg => 
            msg.id === tempMessage.id ? response.data : msg
          )
        )
        logActivity("send_message", `Envió mensaje en canal ${activeChannel}`, "communication", activeChannel)
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error)
      // Remover mensaje temporal si falló
      setChatMessages((prev) => prev.filter(msg => msg.id !== tempMessage.id))
      alert('Error al enviar el mensaje')
    }
  }

  const createChannel = async () => {
    if (!newChannelName.trim()) return

    try {
      const response = await chatApi.createChannel({
        name: newChannelName,
        type: "laboratory",
        participants: [authState.currentUser?.id || ""],
      })

      if (response.success && response.data) {
        setChatChannels((prev) => [...prev, response.data])
        setNewChannelName("")
        setShowCreateChannel(false)
        logActivity("create_channel", `Creó el canal ${newChannelName}`, "communication", response.data.id, newChannelName)
      }
    } catch (error) {
      console.error('Error creando canal:', error)
      alert('Error al crear el canal')
    }
  }

  const deleteChannel = async (channelId: string) => {
    if (channelId === "general" || channelId === "inter-lab") return

    try {
      await chatApi.deleteChannel(channelId)
      setChatChannels((prev) => prev.filter((c) => c.id !== channelId))
      if (activeChannel === channelId) {
        setActiveChannel("general")
      }
      logActivity("delete_channel", `Eliminó un canal de chat`, "communication", channelId)
    } catch (error) {
      console.error('Error eliminando canal:', error)
      alert('Error al eliminar el canal')
    }
  }

  const changeChannel = async (channelId: string) => {
    setActiveChannel(channelId)
    setSelectedChannel(channelId)
    
    try {
      const response = await chatApi.getMessages(channelId)
      if (response.success && response.data) {
        setChatMessages(response.data)
      }
    } catch (error) {
      console.error('Error cargando mensajes del canal:', error)
    }
  }

  const addClient = () => {
    const newClient: Client = {
      id: `client-${Date.now()}`,
      name: "",
      email: "",
      phone: "",
      tests: [],
    }
    setEditingClient(newClient)
  }

  const saveClient = async (client: Client) => {
    try {
      if (client.id.startsWith("client-")) {
        // Crear nuevo cliente
        const response = await clientsApi.create({
          name: client.name,
          email: client.email,
          phone: client.phone
        })
        if (response.success && response.data) {
          setClients((prev) => [...prev, response.data])
          logActivity("add_client", `Agregó cliente ${client.name}`, "test_management", response.data.id, client.name)
        }
      } else {
        // Actualizar cliente existente
        const response = await clientsApi.update(client.id, {
          name: client.name,
          email: client.email,
          phone: client.phone
        })
        if (response.success && response.data) {
          setClients((prev) => prev.map((c) => (c.id === client.id ? response.data : c)))
          logActivity("edit_client", `Editó cliente ${client.name}`, "test_management", client.id, client.name)
        }
      }
      setEditingClient(null)
    } catch (error) {
      console.error('Error guardando cliente:', error)
      alert('Error al guardar el cliente')
    }
  }

  const saveLaboratory = async (lab: Laboratory) => {
    try {
      if (lab.id.startsWith("new-lab-")) {
        // Crear nuevo laboratorio
        const response = await laboratoriesApi.create({
          name: lab.name,
          address: lab.address
        })
        if (response.success && response.data) {
          setLaboratories((prev) => [...prev, response.data])
          logActivity("add_lab", `Agregó laboratorio ${lab.name}`, "lab_management", response.data.id, lab.name)
        }
      } else {
        // Actualizar laboratorio existente
        const response = await laboratoriesApi.update(lab.id, {
          name: lab.name,
          address: lab.address
        })
        if (response.success && response.data) {
          setLaboratories((prev) => prev.map((l) => (l.id === lab.id ? response.data : l)))
          logActivity("edit_lab", `Editó laboratorio ${lab.name}`, "lab_management", lab.id, lab.name)
        }
      }
      setEditingLab(null)
    } catch (error) {
      console.error('Error guardando laboratorio:', error)
      alert('Error al guardar el laboratorio')
    }
  }

  const deleteClient = async (clientId: string) => {
    try {
      await clientsApi.delete(clientId)
      setClients((prev) => prev.filter((c) => c.id !== clientId))
      logActivity("delete_client", `Eliminó cliente`, "test_management", clientId)
    } catch (error) {
      console.error('Error eliminando cliente:', error)
      alert('Error al eliminar el cliente')
    }
  }

  const addTestToClient = (clientId: string) => {
    const test: ClientTest = {
      id: `test-${Date.now()}`,
      testId: `t-${Date.now()}`,
      testName: testAssignment.testType,
      clientId,
      orderDate: new Date().toISOString(),
      status: "ordenada",
      assignedTo: testAssignment.assignedTechnician,
      assignedBy: authState.currentUser?.name,
      assignedDate: new Date().toISOString(),
    }

    setClients((prev) =>
      prev.map((client) => (client.id === clientId ? { ...client, tests: [...client.tests, test] } : client)),
    )

    logActivity("assign_test", `Asignó prueba ${test.testName} a cliente`, "test_management", test.id, test.testName)
    setShowTestAssignment(false)
    setTestAssignment({
      clientId: "",
      testType: "",
      assignedLab: "",
      externalLab: "",
      priority: "normal",
      notes: "",
      assignedTechnician: "",
    })
  }

  if (!authState.isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} loginError={loginError} isLoading={isLoading} />
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? "dark" : ""}`}>
      <div className="medical-gradient min-h-screen">
        <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <img src="/alquimist-logo.png" alt="ALQUIMIST" className="h-8 w-auto" />
              <div>
                <h1 className="text-xl font-serif font-bold text-card-foreground">Laboratorios Alquimist</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {breadcrumb.map((item, index) => (
                    <span key={index} className="flex items-center gap-2">
                      {index > 0 && <span>/</span>}
                      <span>{item}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {hasPermission("system_admin") && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUsers(true)}
                    className="border-primary/20 text-primary hover:bg-primary/10"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Usuarios
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowActivities(true)}
                    className="border-accent/20 text-accent hover:bg-accent/10"
                  >
                    <ActivityIcon className="w-4 h-4 mr-2" />
                    Actividades
                  </Button>
                </>
              )}

              <Button variant="outline" size="sm" onClick={toggleDarkMode} className="border-border bg-transparent">
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>

              <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-primary">{authState.currentUser?.name || "Usuario"}</span>
                <span className="text-xs text-muted-foreground">({authState.currentUser?.role || "Sin rol"})</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-red-200 text-red-700 hover:bg-red-50 bg-transparent"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-muted/50">
              {canViewTab("laboratories") && (
                <TabsTrigger
                  value="laboratories"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Laboratorios
                </TabsTrigger>
              )}
              {canViewTab("clients") && (
                <TabsTrigger
                  value="clients"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Clientes
                </TabsTrigger>
              )}
              <TabsTrigger
                value="chat"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Chat
              </TabsTrigger>
              {canViewTab("admin") && (
                <TabsTrigger
                  value="admin"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Admin
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="laboratories" className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-serif font-bold text-card-foreground">Gestión de Laboratorios</h2>
                {hasPermission("manage_labs") && (
                  <Button
                    onClick={() =>
                      setEditingLab({
                        id: `new-lab-${Date.now()}`,
                        name: "",
                        address: "",
                        machines: [],
                        inventory: [],
                      })
                    }
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={isLoadingLabs}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Laboratorio
                  </Button>
                )}
              </div>

              {isLoadingLabs && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Cargando laboratorios...</span>
                </div>
              )}

              {laboratories.map((lab) => (
                <Card key={lab.id} className="border border-border shadow-sm bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (expandedLab === lab.id) {
                              setExpandedLab(null)
                              setBreadcrumb(["Laboratorios"])
                            } else {
                              setExpandedLab(lab.id)
                              setBreadcrumb(["Laboratorios", lab.name])
                            }
                          }}
                          className="p-1"
                        >
                          {expandedLab === lab.id ? (
                            <ChevronDown className="w-5 h-5 text-primary" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          )}
                        </Button>
                        <div>
                          <h3 className="text-lg font-serif font-semibold text-card-foreground">{lab.name}</h3>
                          <p className="text-sm text-muted-foreground">{lab.address}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {hasPermission("manage_labs") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingLab(lab)}
                            className="border-primary/20 text-primary hover:bg-primary/10"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canPerformCriticalAction("delete_labs") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteLaboratory(lab.id)}
                            className="border-red-200 text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="clients" className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-serif font-bold text-card-foreground">Gestión de Clientes</h2>
                <div className="flex gap-2">
                  <Button 
                    onClick={addClient} 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={isLoadingClients}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Cliente
                  </Button>
                  <Button
                    onClick={() => setShowTestAssignment(true)}
                    className="bg-accent hover:bg-accent/90 text-white"
                    disabled={isLoadingClients}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Asignar Prueba
                  </Button>
                </div>
              </div>

              {isLoadingClients && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Cargando clientes...</span>
                </div>
              )}

              <div className="grid gap-4">
                {clients.map((client) => (
                  <Card key={client.id} className="border border-border shadow-sm bg-card">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-serif font-semibold text-card-foreground">{client.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {client.email} • {client.phone}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingClient(client)}
                            className="border-primary/20 text-primary hover:bg-primary/10"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteClient(client.id)}
                            className="border-red-200 text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium text-card-foreground">Pruebas ({client.tests.length})</h4>
                        {client.tests.map((test) => (
                          <div key={test.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div>
                              <p className="font-medium text-card-foreground">{test.testName}</p>
                              <p className="text-sm text-muted-foreground">
                                Ordenada: {new Date(test.orderDate).toLocaleDateString()}
                              </p>
                              {test.assignedTo && <p className="text-xs text-accent">Asignada a: {test.assignedTo}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  test.status === "completada"
                                    ? "bg-green-100 text-green-800"
                                    : test.status === "en_proceso"
                                      ? "bg-blue-100 text-blue-800"
                                      : test.status === "enviada"
                                        ? "bg-purple-100 text-purple-800"
                                        : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {test.status.replace("_", " ")}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="chat" className="p-4">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-200px)]">
                {/* Sidebar de canales */}
                <div className="lg:col-span-1 bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-serif font-semibold text-card-foreground">Canales</h3>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={clearChatCache}
                        className="border-orange-200 text-orange-600 hover:bg-orange-50"
                        title="Limpiar cache del chat"
                      >
                        🧹
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowCreateChannel(true)}
                        className="border-primary/20 text-primary hover:bg-primary/10"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {chatChannels.map((channel) => (
                      <div
                        key={channel.id}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                          activeChannel === channel.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        }`}
                        onClick={() => changeChannel(channel.id)}
                      >
                        <span className="text-sm font-medium"># {channel.name}</span>
                        {channel.id !== "general" && channel.id !== "inter-lab" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteChannel(channel.id)
                            }}
                            className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <h4 className="font-medium text-card-foreground mb-2">Usuarios en línea</h4>
                    <div className="space-y-2">
                      {chatUsers
                        .filter((u) => u.isOnline)
                        .map((user) => (
                          <div key={user.id} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-muted-foreground">{user.name}</span>
                            <span className="text-xs text-muted-foreground">({user.role})</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Área de chat */}
                <div className="lg:col-span-3 bg-card border border-border rounded-lg flex flex-col">
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif font-semibold text-card-foreground">
                        # {chatChannels.find((c) => c.id === activeChannel)?.name}
                      </h3>
                      {isSyncing && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          Sincronizando...
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 p-4 overflow-y-auto space-y-3">
                    {chatMessages
                      .filter((msg) => msg.channelId === activeChannel)
                      .map((message) => (
                        <div key={message.id} className="flex gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {message.userName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-card-foreground">{message.userName}</span>
                              <span className="text-xs text-muted-foreground">{message.userRole}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{message.content}</p>
                          </div>
                        </div>
                      ))}
                  </div>

                  <div className="p-4 border-t border-border">
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                        className="flex-1"
                      />
                      <Button onClick={sendMessage} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        Enviar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Modal para crear canal */}
            {showCreateChannel && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
                  <h3 className="text-lg font-serif font-bold text-card-foreground mb-4">Crear Nuevo Canal</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground">Nombre del Canal</label>
                      <Input
                        value={newChannelName}
                        onChange={(e) => setNewChannelName(e.target.value)}
                        placeholder="nombre-del-canal"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={createChannel}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        Crear Canal
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowCreateChannel(false)
                          setNewChannelName("")
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal para editar cliente */}
            {editingClient && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
                  <h3 className="text-lg font-serif font-bold text-card-foreground mb-4">
                    {editingClient.id.startsWith("client-") ? "Nuevo Cliente" : "Editar Cliente"}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground">Nombre</label>
                      <Input
                        value={editingClient.name}
                        onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                        placeholder="Nombre completo"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Email</label>
                      <Input
                        type="email"
                        value={editingClient.email}
                        onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                        placeholder="email@ejemplo.com"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Teléfono</label>
                      <Input
                        value={editingClient.phone}
                        onChange={(e) => setEditingClient({ ...editingClient, phone: e.target.value })}
                        placeholder="555-0123"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => saveClient(editingClient)}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        Guardar
                      </Button>
                      <Button variant="outline" onClick={() => setEditingClient(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal para editar laboratorio */}
            {editingLab && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
                  <h3 className="text-lg font-serif font-bold text-card-foreground mb-4">
                    {editingLab.id.startsWith("new-lab-") ? "Nuevo Laboratorio" : "Editar Laboratorio"}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground">Nombre</label>
                      <Input
                        value={editingLab.name}
                        onChange={(e) => setEditingLab({ ...editingLab, name: e.target.value })}
                        placeholder="Nombre del laboratorio"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Dirección</label>
                      <Input
                        value={editingLab.address}
                        onChange={(e) => setEditingLab({ ...editingLab, address: e.target.value })}
                        placeholder="Dirección completa"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => saveLaboratory(editingLab)}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        Guardar
                      </Button>
                      <Button variant="outline" onClick={() => setEditingLab(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal para asignar prueba */}
            {showTestAssignment && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
                  <h3 className="text-lg font-serif font-bold text-card-foreground mb-4">Asignar Prueba</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground">Cliente</label>
                      <select
                        value={testAssignment.clientId}
                        onChange={(e) => setTestAssignment({ ...testAssignment, clientId: e.target.value })}
                        className="w-full mt-1 p-2 border border-border rounded-md bg-background"
                      >
                        <option value="">Seleccionar cliente</option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Tipo de Prueba</label>
                      <Input
                        value={testAssignment.testType}
                        onChange={(e) => setTestAssignment({ ...testAssignment, testType: e.target.value })}
                        placeholder="Hemograma, Química sanguínea, etc."
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Técnico Asignado</label>
                      <select
                        value={testAssignment.assignedTechnician}
                        onChange={(e) => setTestAssignment({ ...testAssignment, assignedTechnician: e.target.value })}
                        className="w-full mt-1 p-2 border border-border rounded-md bg-background"
                      >
                        <option value="">Seleccionar técnico</option>
                        {chatUsers
                          .filter((u) => u.role === "Técnico")
                          .map((tech) => (
                            <option key={tech.id} value={tech.name}>
                              {tech.name}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => addTestToClient(testAssignment.clientId)}
                        disabled={!testAssignment.clientId || !testAssignment.testType}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        Asignar Prueba
                      </Button>
                      <Button variant="outline" onClick={() => setShowTestAssignment(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  )
}
