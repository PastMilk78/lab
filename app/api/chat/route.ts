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

// Datos iniciales (en producción esto estaría en una base de datos)
let chatChannels = [
  { 
    id: "general", 
    name: "General", 
    type: "general" as const, 
    participants: [], 
    lastMessage: undefined 
  },
  { 
    id: "inter-lab", 
    name: "Inter-Lab", 
    type: "general" as const, 
    participants: [], 
    lastMessage: undefined 
  },
]

let chatMessages = [
  {
    id: "msg1",
    channelId: "general",
    userId: "admin-1",
    userName: "Dr. Ana García",
    userRole: "Admin",
    content: "¡Bienvenidos al sistema de chat interno!",
    timestamp: new Date().toISOString(),
    type: "message" as const,
  },
]

let chatUsers = [
  {
    id: "admin-1",
    name: "Dr. Ana García",
    role: "Admin",
    email: "admin@alquimist.com",
    password: "admin123",
    permissions: [
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
    isOnline: true,
    labId: "lab-1",
  },
  {
    id: "jefe-1",
    name: "Dr. Carlos Mendez",
    role: "Jefe de Lab",
    email: "jefe@alquimist.com",
    password: "jefe123",
    permissions: [
      "manage_labs",
      "view_all", 
      "assign_tests",
      "manage_inventory",
      "view_activities"
    ],
    isOnline: true,
    labId: "lab-1",
  },
  {
    id: "tecnico-1",
    name: "María López",
    role: "Técnico",
    email: "tecnico@alquimist.com",
    password: "tecnico123",
    permissions: [
      "view_assigned",
      "update_tests",
      "view_inventory"
    ],
    isOnline: true,
    labId: "lab-1",
  },
  {
    id: "patologa-1",
    name: "Dra. Elena Ruiz",
    role: "Patóloga",
    email: "patologa@alquimist.com",
    password: "patologa123",
    permissions: [
      "view_results",
      "approve_tests",
      "view_all"
    ],
    isOnline: false,
    labId: "lab-2",
  },
]

// GET - Obtener canales y mensajes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('channelId')
    const type = searchParams.get('type')

    if (type === 'channels') {
      return NextResponse.json({
        success: true,
        data: chatChannels,
      })
    }

    if (type === 'users') {
      return NextResponse.json({
        success: true,
        data: chatUsers,
      })
    }

    if (channelId) {
      const messages = chatMessages.filter(msg => msg.channelId === channelId)
      return NextResponse.json({
        success: true,
        data: messages,
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        channels: chatChannels,
        messages: chatMessages,
        users: chatUsers,
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

    const newMessage = {
      id: `msg-${Date.now()}`,
      ...validatedData,
      timestamp: new Date().toISOString(),
    }

    chatMessages.push(newMessage)

    // Actualizar último mensaje del canal
    const channelIndex = chatChannels.findIndex(ch => ch.id === validatedData.channelId)
    if (channelIndex !== -1) {
      chatChannels[channelIndex].lastMessage = newMessage
    }

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

// PUT - Crear canal
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = channelSchema.parse(body)

    const newChannel = {
      id: `channel-${Date.now()}`,
      ...validatedData,
      lastMessage: undefined,
    }

    chatChannels.push(newChannel)

    return NextResponse.json({
      success: true,
      data: newChannel,
      message: 'Canal creado exitosamente',
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al crear canal' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar canal
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('channelId')

    if (!channelId) {
      return NextResponse.json(
        { error: 'ID de canal requerido' },
        { status: 400 }
      )
    }

    // No permitir eliminar canales del sistema
    if (channelId === 'general' || channelId === 'inter-lab') {
      return NextResponse.json(
        { error: 'No se puede eliminar un canal del sistema' },
        { status: 403 }
      )
    }

    const channelIndex = chatChannels.findIndex(ch => ch.id === channelId)
    if (channelIndex === -1) {
      return NextResponse.json(
        { error: 'Canal no encontrado' },
        { status: 404 }
      )
    }

    chatChannels.splice(channelIndex, 1)

    // Eliminar mensajes del canal
    chatMessages = chatMessages.filter(msg => msg.channelId !== channelId)

    return NextResponse.json({
      success: true,
      message: 'Canal eliminado exitosamente',
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Error al eliminar canal' },
      { status: 500 }
    )
  }
}
