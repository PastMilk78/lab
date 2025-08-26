import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Esquemas de validación
const assignmentSchema = z.object({
  testId: z.string().min(1, 'ID de prueba requerido'),
  clientTestId: z.string().optional(),
  recordId: z.string().optional(),
  technicianId: z.string().min(1, 'ID de técnico requerido'),
  technicianName: z.string().min(1, 'Nombre de técnico requerido'),
  assignedBy: z.string().min(1, 'Asignado por requerido'),
  status: z.enum(['asignada', 'en_proceso', 'completada']),
  notes: z.string().optional(),
})

// Datos iniciales (en producción esto estaría en una base de datos)
let assignments = [
  {
    id: "assignment-1",
    testId: "t1",
    clientTestId: "ct1",
    recordId: "1-1-1",
    technicianId: "tecnico-1",
    technicianName: "María López",
    assignedBy: "Dr. Carlos Mendez",
    assignedDate: "2024-01-15T10:00:00Z",
    status: "completada" as const,
    notes: "Prueba completada exitosamente",
  },
  {
    id: "assignment-2",
    testId: "t2",
    clientTestId: "ct2",
    technicianId: "tecnico-1",
    technicianName: "María López",
    assignedBy: "Dr. Carlos Mendez",
    assignedDate: "2024-01-20T14:30:00Z",
    status: "en_proceso" as const,
    notes: "Prueba en proceso de análisis",
  },
]

// GET - Obtener asignaciones
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const technicianId = searchParams.get('technicianId')
    const status = searchParams.get('status')
    const testId = searchParams.get('testId')

    let filteredAssignments = [...assignments]

    // Filtrar por técnico
    if (technicianId) {
      filteredAssignments = filteredAssignments.filter(assignment => assignment.technicianId === technicianId)
    }

    // Filtrar por estado
    if (status) {
      filteredAssignments = filteredAssignments.filter(assignment => assignment.status === status)
    }

    // Filtrar por prueba
    if (testId) {
      filteredAssignments = filteredAssignments.filter(assignment => assignment.testId === testId)
    }

    // Ordenar por fecha de asignación (más reciente primero)
    filteredAssignments.sort((a, b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime())

    return NextResponse.json({
      success: true,
      data: filteredAssignments,
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener asignaciones' },
      { status: 500 }
    )
  }
}

// POST - Crear nueva asignación
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = assignmentSchema.parse(body)

    const newAssignment = {
      id: `assignment-${Date.now()}`,
      ...validatedData,
      assignedDate: new Date().toISOString(),
    }

    assignments.push(newAssignment)

    return NextResponse.json({
      success: true,
      data: newAssignment,
      message: 'Asignación creada exitosamente',
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al crear asignación' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar asignación
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID de asignación requerido' },
        { status: 400 }
      )
    }

    const assignmentIndex = assignments.findIndex(assignment => assignment.id === id)
    if (assignmentIndex === -1) {
      return NextResponse.json(
        { error: 'Asignación no encontrada' },
        { status: 404 }
      )
    }

    const validatedData = assignmentSchema.partial().parse(updateData)
    assignments[assignmentIndex] = { ...assignments[assignmentIndex], ...validatedData }

    return NextResponse.json({
      success: true,
      data: assignments[assignmentIndex],
      message: 'Asignación actualizada exitosamente',
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al actualizar asignación' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar asignación
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID de asignación requerido' },
        { status: 400 }
      )
    }

    const assignmentIndex = assignments.findIndex(assignment => assignment.id === id)
    if (assignmentIndex === -1) {
      return NextResponse.json(
        { error: 'Asignación no encontrada' },
        { status: 404 }
      )
    }

    assignments.splice(assignmentIndex, 1)

    return NextResponse.json({
      success: true,
      message: 'Asignación eliminada exitosamente',
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Error al eliminar asignación' },
      { status: 500 }
    )
  }
}
