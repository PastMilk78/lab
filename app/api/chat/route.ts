import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Esquemas de validación
const messageSchema = z.object({
  channelId: z.string().min(1, 'ID de canal requerido'),
  userId: z.string().min(1, 'ID de usuario requerido'),
  userName: z.string().min(1, 'Nombre de usuario requerido'),
  userRole: z.string().min(1, 'Rol de usuario requerido'),
  content: z.string().min(1, 'Contenido requerido'),
  type: z.enum(['message', 'system', 'lab-request']),
  labRequest: z.object({
    fromLabId: z.string(),
    toLabId: z.string(),
    fromLabName: z.string(),
    toLabName: z.string(),
    testType: z.string(),
    clientName: z.string(),
    priority: z.enum(['normal', 'urgent', 'critical']),
    status: z.enum(['pending', 'accepted', 'rejected', 'completed']),
    requestedBy: z.string(),
    notes: z.string(),
  }).optional(),
})

const channelSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  type: z.enum(['laboratory', 'general', 'direct']),
  labId: z.string().optional(),
  participants: z.array(z.string()),
})

// Simulación de almacenamiento persistente con localStorage simulation
class ChatStorage {
  private static instance: ChatStorage
  private channels: any[] = []
  private messages: any[] = []
  private users: any[] = []

  constructor() {
    this.initializeData()
  }

  static getInstance(): ChatStorage {
    if (!ChatStorage.instance) {
      ChatStorage.instance = new ChatStorage()
    }
    return ChatStorage.instance
  }

  private initializeData() {
    // Intentar cargar datos desde "localStorage" simulation
    const savedChannels = this.getFromStorage('chat_channels')
    const savedMessages = this.getFromStorage('chat_messages')
    const savedUsers = this.getFromStorage('chat_users')

    if (savedChannels && savedMessages && savedUsers) {
      this.channels = savedChannels
      this.messages = savedMessages
      this.users = savedUsers
    } else {
      // Datos iniciales si no hay cache
      this.channels = [
        { 
          id: "general", 
          name: "General", 
          type: "general", 
          participants: [], 
          lastMessage: undefined,
          createdAt: new Date().toISOString(),
          createdBy: "system"
        },
        { 
          id: "inter-lab", 
          name: "Inter-Lab", 
          type: "general", 
          participants: [], 
          lastMessage: undefined,
          createdAt: new Date().toISOString(),
          createdBy: "system"
        },
      ]

      this.messages = [
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
      ]

      this.users = [
        {
          id: "admin-1",
          name: "Dr. Ana García",
          role: "Admin",
          email: "admin@alquimist.com",
          isOnline: true,
          labId: "lab-1",
          lastSeen: new Date().toISOString(),
        },
        {
          id: "jefe-1",
          name: "Dr. Carlos Mendez",
          role: "Jefe de Lab",
          email: "jefe@alquimist.com",
          isOnline: true,
          labId: "lab-1",
          lastSeen: new Date().toISOString(),
        },
        {
          id: "tecnico-1",
          name: "María López",
          role: "Técnico",
          email: "tecnico@alquimist.com",
          isOnline: true,
          labId: "lab-1",
          lastSeen: new Date().toISOString(),
        },
        {
          id: "patologa-1",
          name: "Dra. Elena Ruiz",
          role: "Patóloga",
          email: "patologa@alquimist.com",
          isOnline: false,
          labId: "lab-2",
          lastSeen: new Date(Date.now() - 3600000).toISOString(), // 1 hora atrás
        },
      ]

      // Guardar datos iniciales
      this.saveToStorage()
    }
  }

  // Simulación de localStorage para el servidor
  private getFromStorage(key: string): any {
    try {
      // En un entorno real, esto sería una base de datos
      // Por ahora, simulamos persistencia en memoria
      return null // Siempre retorna null para forzar datos iniciales
    } catch (error) {
      console.error('Error reading from storage:', error)
      return null
    }
  }

  private saveToStorage(): void {
    try {
      // En un entorno real, esto guardaría en una base de datos
      // Por ahora, solo mantenemos en memoria
      console.log('💾 Chat data saved to storage')
    } catch (error) {
      console.error('Error saving to storage:', error)
    }
  }

  // Métodos para canales
  getChannels() {
    return this.channels
  }

  addChannel(channel: any) {
    const newChannel = {
      ...channel,
      id: channel.id || `channel-${Date.now()}`,
      createdAt: new Date().toISOString(),
      lastMessage: undefined,
    }
    this.channels.push(newChannel)
    this.saveToStorage()
    return newChannel
  }

  deleteChannel(channelId: string) {
    const index = this.channels.findIndex(ch => ch.id === channelId)
    if (index !== -1) {
      this.channels.splice(index, 1)
      // También eliminar mensajes del canal
      this.messages = this.messages.filter(msg => msg.channelId !== channelId)
      this.saveToStorage()
      return true
    }
    return false
  }

  // Métodos para mensajes
  getMessages(channelId?: string) {
    if (channelId) {
      return this.messages.filter(msg => msg.channelId === channelId)
    }
    return this.messages
  }

  addMessage(message: any) {
    const newMessage = {
      ...message,
      id: message.id || `msg-${Date.now()}`,
      timestamp: new Date().toISOString(),
    }
    this.messages.push(newMessage)

    // Actualizar último mensaje del canal
    const channelIndex = this.channels.findIndex(ch => ch.id === message.channelId)
    if (channelIndex !== -1) {
      this.channels[channelIndex].lastMessage = newMessage
    }

    this.saveToStorage()
    return newMessage
  }

  // Métodos para usuarios
  getUsers() {
    return this.users
  }

  updateUserStatus(userId: string, isOnline: boolean) {
    const userIndex = this.users.findIndex(u => u.id === userId)
    if (userIndex !== -1) {
      this.users[userIndex].isOnline = isOnline
      this.users[userIndex].lastSeen = new Date().toISOString()
      this.saveToStorage()
      return this.users[userIndex]
    }
    return null
  }

  // Limpiar mensajes antiguos (más de 30 días)
  cleanupOldMessages() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const originalCount = this.messages.length
    this.messages = this.messages.filter(msg => new Date(msg.timestamp) > thirtyDaysAgo)
    this.saveToStorage()
    return originalCount - this.messages.length
  }

  // Método para obtener estadísticas
  getStats() {
    return {
      totalMessages: this.messages.length,
      totalChannels: this.channels.length,
      totalUsers: this.users.length,
      onlineUsers: this.users.filter(u => u.isOnline).length,
      lastActivity: this.messages.length > 0 ? this.messages[this.messages.length - 1].timestamp : null
    }
  }
}

// Instancia global del almacenamiento
const chatStorage = ChatStorage.getInstance()

// GET - Obtener canales y mensajes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('channelId')
    const type = searchParams.get('type')

    if (type === 'channels') {
      return NextResponse.json({
        success: true,
        data: chatStorage.getChannels(),
      })
    }

    if (type === 'users') {
      return NextResponse.json({
        success: true,
        data: chatStorage.getUsers(),
      })
    }

    if (type === 'stats') {
      return NextResponse.json({
        success: true,
        data: chatStorage.getStats(),
      })
    }

    if (channelId) {
      const messages = chatStorage.getMessages(channelId)
      return NextResponse.json({
        success: true,
        data: messages,
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        channels: chatStorage.getChannels(),
        messages: chatStorage.getMessages(),
        users: chatStorage.getUsers(),
        stats: chatStorage.getStats(),
      },
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener datos del chat' },
      { status: 500 }
    )
  }
}

// POST - Enviar mensaje
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = messageSchema.parse(body)

    const newMessage = chatStorage.addMessage(validatedData)

    return NextResponse.json({
      success: true,
      data: newMessage,
      message: 'Mensaje enviado exitosamente',
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al enviar mensaje' },
      { status: 500 }
    )
  }
}

// PUT - Crear canal o actualizar estado de usuario
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    if (action === 'create_channel') {
      const validatedData = channelSchema.parse(data)
      const newChannel = chatStorage.addChannel(validatedData)

      return NextResponse.json({
        success: true,
        data: newChannel,
        message: 'Canal creado exitosamente',
      }, { status: 201 })
    }

    if (action === 'update_user_status') {
      const { userId, isOnline } = data
      const updatedUser = chatStorage.updateUserStatus(userId, isOnline)

      if (updatedUser) {
        return NextResponse.json({
          success: true,
          data: updatedUser,
          message: 'Estado de usuario actualizado',
        })
      } else {
        return NextResponse.json(
          { error: 'Usuario no encontrado' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    )

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error en la operación' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar canal o limpiar mensajes
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('channelId')
    const action = searchParams.get('action')

    if (action === 'cleanup_messages') {
      const deletedCount = chatStorage.cleanupOldMessages()
      return NextResponse.json({
        success: true,
        message: `Se eliminaron ${deletedCount} mensajes antiguos`,
        deletedCount,
      })
    }

    if (channelId) {
      // No permitir eliminar canales del sistema
      if (channelId === 'general' || channelId === 'inter-lab') {
        return NextResponse.json(
          { error: 'No se puede eliminar un canal del sistema' },
          { status: 403 }
        )
      }

      const deleted = chatStorage.deleteChannel(channelId)
      if (deleted) {
        return NextResponse.json({
          success: true,
          message: 'Canal eliminado exitosamente',
        })
      } else {
        return NextResponse.json(
          { error: 'Canal no encontrado' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Parámetros requeridos' },
      { status: 400 }
    )

  } catch (error) {
    return NextResponse.json(
      { error: 'Error al eliminar canal' },
      { status: 500 }
    )
  }
}
