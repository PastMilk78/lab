import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Esquemas de validación
const activitySchema = z.object({
  userId: z.string().min(1, 'ID de usuario requerido'),
  userName: z.string().min(1, 'Nombre de usuario requerido'),
  userRole: z.string().min(1, 'Rol de usuario requerido'),
  action: z.string().min(1, 'Acción requerida'),
  description: z.string().min(1, 'Descripción requerida'),
  category: z.enum(['authentication', 'test_management', 'lab_management', 'communication', 'inventory', 'assignment']),
  relatedId: z.string().optional(),
  relatedName: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

// Datos iniciales (en producción esto estaría en una base de datos)
let activities = [
  {
    id: "activity-1",
    userId: "admin-1",
    userName: "Dr. Ana García",
    userRole: "Admin",
    action: "login",
    description: "Dr. Ana García inició sesión en el sistema",
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hora atrás
    category: "authentication" as const,
  },
  {
    id: "activity-2",
    userId: "jefe-1",
    userName: "Dr. Carlos Mendez",
    userRole: "Jefe de Lab",
    action: "create_lab",
    description: "Dr. Carlos Mendez creó el laboratorio Lab Sur",
    timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 horas atrás
    category: "lab_management" as const,
    relatedId: "2",
    relatedName: "Lab Sur",
  },
  {
    id: "activity-3",
    userId: "tecnico-1",
    userName: "María López",
    userRole: "Técnico",
    action: "assign_test",
    description: "María López asignó prueba Química Sanguínea a María González",
    timestamp: new Date(Date.now() - 10800000).toISOString(), // 3 horas atrás
    category: "test_management" as const,
    relatedId: "ct2",
    relatedName: "Química Sanguínea",
  },
  {
    id: "activity-4",
    userId: "admin-1",
    userName: "Dr. Ana García",
    userRole: "Admin",
    action: "add_inventory",
    description: "Dr. Ana García agregó Microscopios al inventario del Lab Sur",
    timestamp: new Date(Date.now() - 14400000).toISOString(), // 4 horas atrás
    category: "inventory" as const,
    relatedId: "inv-4",
    relatedName: "Microscopios",
  },
  {
    id: "activity-5",
    userId: "jefe-1",
    userName: "Dr. Carlos Mendez",
    userRole: "Jefe de Lab",
    action: "send_message",
    description: "Dr. Carlos Mendez envió mensaje en canal General",
    timestamp: new Date(Date.now() - 18000000).toISOString(), // 5 horas atrás
    category: "communication" as const,
    relatedId: "general",
    relatedName: "Canal General",
  },
]

// GET - Obtener actividades con filtros opcionales
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let filteredActivities = [...activities]

    // Filtrar por usuario
    if (userId) {
      filteredActivities = filteredActivities.filter(activity => activity.userId === userId)
    }

    // Filtrar por categoría
    if (category) {
      filteredActivities = filteredActivities.filter(activity => activity.category === category)
    }

    // Ordenar por timestamp (más reciente primero)
    filteredActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Aplicar paginación
    const paginatedActivities = filteredActivities.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      data: paginatedActivities,
      pagination: {
        total: filteredActivities.length,
        limit,
        offset,
        hasMore: offset + limit < filteredActivities.length,
      },
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener actividades' },
      { status: 500 }
    )
  }
}

// POST - Crear nueva actividad
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = activitySchema.parse(body)

    const newActivity = {
      id: `activity-${Date.now()}`,
      ...validatedData,
      timestamp: new Date().toISOString(),
    }

    activities.unshift(newActivity) // Agregar al inicio del array

    // Mantener solo las últimas 1000 actividades para evitar problemas de memoria
    if (activities.length > 1000) {
      activities = activities.slice(0, 1000)
    }

    return NextResponse.json({
      success: true,
      data: newActivity,
      message: 'Actividad registrada exitosamente',
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al registrar actividad' },
      { status: 500 }
    )
  }
}

// DELETE - Limpiar actividades antiguas
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const originalCount = activities.length
    activities = activities.filter(activity => new Date(activity.timestamp) > cutoffDate)

    const deletedCount = originalCount - activities.length

    return NextResponse.json({
      success: true,
      message: `Se eliminaron ${deletedCount} actividades anteriores a ${days} días`,
      deletedCount,
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Error al limpiar actividades' },
      { status: 500 }
    )
  }
}
