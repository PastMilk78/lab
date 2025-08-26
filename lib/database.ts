import fs from 'fs'
import path from 'path'

// Interfaz para los datos del chat
interface ChatMessage {
  id: string
  channelId: string
  userId: string
  userName: string
  userRole: string
  content: string
  timestamp: string
  type: 'message' | 'system' | 'lab-request'
}

interface ChatChannel {
  id: string
  name: string
  type: 'laboratory' | 'general' | 'direct'
  participants: string[]
  lastMessage?: ChatMessage
  createdAt: string
  createdBy: string
}

interface ChatUser {
  id: string
  name: string
  role: string
  email: string
  isOnline: boolean
  labId: string
  lastSeen: string
}

interface ChatData {
  messages: ChatMessage[]
  channels: ChatChannel[]
  users: ChatUser[]
}

class ChatDatabase {
  private static instance: ChatDatabase
  private data: ChatData
  private dataPath: string

  constructor() {
    // En Vercel, usamos /tmp para archivos temporales
    this.dataPath = path.join(process.cwd(), 'data', 'chat.json')
    this.data = this.loadData()
  }

  static getInstance(): ChatDatabase {
    if (!ChatDatabase.instance) {
      ChatDatabase.instance = new ChatDatabase()
    }
    return ChatDatabase.instance
  }

  private loadData(): ChatData {
    try {
      // Crear directorio si no existe
      const dir = path.dirname(this.dataPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      // Cargar datos existentes o crear iniciales
      if (fs.existsSync(this.dataPath)) {
        const fileContent = fs.readFileSync(this.dataPath, 'utf-8')
        return JSON.parse(fileContent)
      } else {
        // Datos iniciales
        const initialData: ChatData = {
          messages: [
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
          ],
          channels: [
            {
              id: "general",
              name: "General",
              type: "general",
              participants: [],
              createdAt: new Date().toISOString(),
              createdBy: "system"
            },
            {
              id: "inter-lab",
              name: "Inter-Lab",
              type: "general",
              participants: [],
              createdAt: new Date().toISOString(),
              createdBy: "system"
            },
          ],
          users: [
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
              lastSeen: new Date(Date.now() - 3600000).toISOString(),
            },
          ],
        }

        // Guardar datos iniciales
        this.saveData(initialData)
        return initialData
      }
    } catch (error) {
      console.error('Error loading chat data:', error)
      // Retornar datos vacíos si hay error
      return {
        messages: [],
        channels: [],
        users: []
      }
    }
  }

  private saveData(data: ChatData): void {
    try {
      fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2))
      console.log('💾 Chat data saved to file')
    } catch (error) {
      console.error('Error saving chat data:', error)
    }
  }

  // Métodos para canales
  getChannels(): ChatChannel[] {
    return this.data.channels
  }

  addChannel(channel: Omit<ChatChannel, 'id' | 'createdAt'>): ChatChannel {
    const newChannel: ChatChannel = {
      ...channel,
      id: `channel-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    
    this.data.channels.push(newChannel)
    this.saveData(this.data)
    return newChannel
  }

  deleteChannel(channelId: string): boolean {
    const index = this.data.channels.findIndex(ch => ch.id === channelId)
    if (index !== -1) {
      this.data.channels.splice(index, 1)
      // También eliminar mensajes del canal
      this.data.messages = this.data.messages.filter(msg => msg.channelId !== channelId)
      this.saveData(this.data)
      return true
    }
    return false
  }

  // Métodos para mensajes
  getMessages(channelId?: string): ChatMessage[] {
    if (channelId) {
      return this.data.messages.filter(msg => msg.channelId === channelId)
    }
    return this.data.messages
  }

  addMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg-${Date.now()}`,
      timestamp: new Date().toISOString(),
    }
    
    this.data.messages.push(newMessage)

    // Actualizar último mensaje del canal
    const channelIndex = this.data.channels.findIndex(ch => ch.id === message.channelId)
    if (channelIndex !== -1) {
      this.data.channels[channelIndex].lastMessage = newMessage
    }

    this.saveData(this.data)
    return newMessage
  }

  // Métodos para usuarios
  getUsers(): ChatUser[] {
    return this.data.users
  }

  updateUserStatus(userId: string, isOnline: boolean): ChatUser | null {
    const userIndex = this.data.users.findIndex(u => u.id === userId)
    if (userIndex !== -1) {
      this.data.users[userIndex].isOnline = isOnline
      this.data.users[userIndex].lastSeen = new Date().toISOString()
      this.saveData(this.data)
      return this.data.users[userIndex]
    }
    return null
  }

  // Limpiar mensajes antiguos
  cleanupOldMessages(): number {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const originalCount = this.data.messages.length
    this.data.messages = this.data.messages.filter(msg => new Date(msg.timestamp) > thirtyDaysAgo)
    this.saveData(this.data)
    return originalCount - this.data.messages.length
  }

  // Obtener estadísticas
  getStats() {
    return {
      totalMessages: this.data.messages.length,
      totalChannels: this.data.channels.length,
      totalUsers: this.data.users.length,
      onlineUsers: this.data.users.filter(u => u.isOnline).length,
      lastActivity: this.data.messages.length > 0 ? this.data.messages[this.data.messages.length - 1].timestamp : null
    }
  }

  // Backup de datos
  backup(): string {
    const backupPath = path.join(process.cwd(), 'data', `chat-backup-${Date.now()}.json`)
    try {
      fs.writeFileSync(backupPath, JSON.stringify(this.data, null, 2))
      return backupPath
    } catch (error) {
      console.error('Error creating backup:', error)
      return ''
    }
  }
}

export default ChatDatabase
