import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import ChatDatabase from '@/lib/database'

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

// Instancia global de la base de datos
const chatDB = ChatDatabase.getInstance()

// GET - Obtener canales y mensajes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('channelId')
    const type = searchParams.get('type')

    if (type === 'channels') {
      return NextResponse.json({
        success: true,
        data: chatDB.getChannels(),
      })
    }

    if (type === 'users') {
      return NextResponse.json({
        success: true,
        data: chatDB.getUsers(),
      })
    }

    if (type === 'stats') {
      return NextResponse.json({
        success: true,
        data: chatDB.getStats(),
      })
    }

    if (channelId) {
      const messages = chatDB.getMessages(channelId)
      return NextResponse.json({
        success: true,
        data: messages,
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        channels: chatDB.getChannels(),
        messages: chatDB.getMessages(),
        users: chatDB.getUsers(),
        stats: chatDB.getStats(),
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

    const newMessage = chatDB.addMessage(validatedData)

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
      const newChannel = chatDB.addChannel(validatedData)

      return NextResponse.json({
        success: true,
        data: newChannel,
        message: 'Canal creado exitosamente',
      }, { status: 201 })
    }

    if (action === 'update_user_status') {
      const { userId, isOnline } = data
      const updatedUser = chatDB.updateUserStatus(userId, isOnline)

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
      const deletedCount = chatDB.cleanupOldMessages()
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

      const deleted = chatDB.deleteChannel(channelId)
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
