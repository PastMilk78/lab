import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Esquemas de validación
const clientTestSchema = z.object({
  testId: z.string().min(1, 'ID de prueba requerido'),
  testName: z.string().min(1, 'Nombre de prueba requerido'),
  clientId: z.string().min(1, 'ID de cliente requerido'),
  orderDate: z.string(),
  status: z.enum(['ordenada', 'en_proceso', 'completada', 'enviada']),
  notes: z.string().optional(),
  assignedTo: z.string().optional(),
  assignedBy: z.string().optional(),
  assignedDate: z.string().optional(),
  results: z.array(z.object({
    name: z.string(),
    value: z.string(),
    unit: z.string(),
    referenceMin: z.number(),
    referenceMax: z.number(),
    status: z.enum(['normal', 'high', 'low']),
  })).optional(),
})

// Datos iniciales (en producción esto estaría en una base de datos)
let clients = [
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
        status: "completada" as const,
        results: [
          {
            id: "p1",
            name: "Hemoglobina",
            value: "14.2",
            unit: "g/dL",
            referenceMin: 12.0,
            referenceMax: 16.0,
            status: "normal" as const,
          },
        ],
      },
    ],
  },
  {
    id: "2",
    name: "María González",
    email: "maria@email.com",
    phone: "555-0456",
    tests: [
      {
        id: "ct2",
        testId: "t2",
        testName: "Química Sanguínea",
        clientId: "2",
        orderDate: "2024-01-20",
        status: "en_proceso" as const,
        assignedTo: "María López",
        assignedBy: "Dr. Carlos Mendez",
        assignedDate: "2024-01-20",
      },
    ],
  },
]

// GET - Obtener pruebas de un cliente
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id
    const client = clients.find(c => c.id === clientId)

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: client.tests,
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener pruebas del cliente' },
      { status: 500 }
    )
  }
}

// POST - Agregar prueba a un cliente
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id
    const body = await request.json()
    const validatedData = clientTestSchema.parse(body)

    const client = clients.find(c => c.id === clientId)
    if (!client) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    const newTest = {
      id: `test-${Date.now()}`,
      ...validatedData,
      clientId, // Asegurar que el clientId sea correcto
    }

    client.tests.push(newTest)

    return NextResponse.json({
      success: true,
      data: newTest,
      message: 'Prueba agregada exitosamente',
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al agregar prueba' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar prueba de un cliente
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id
    const body = await request.json()
    const { testId, ...updateData } = body

    if (!testId) {
      return NextResponse.json(
        { error: 'ID de prueba requerido' },
        { status: 400 }
      )
    }

    const client = clients.find(c => c.id === clientId)
    if (!client) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    const testIndex = client.tests.findIndex(test => test.id === testId)
    if (testIndex === -1) {
      return NextResponse.json(
        { error: 'Prueba no encontrada' },
        { status: 404 }
      )
    }

    const validatedData = clientTestSchema.partial().parse(updateData)
    client.tests[testIndex] = { 
      ...client.tests[testIndex], 
      ...validatedData 
    }

    return NextResponse.json({
      success: true,
      data: client.tests[testIndex],
      message: 'Prueba actualizada exitosamente',
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al actualizar prueba' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar prueba de un cliente
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id
    const { searchParams } = new URL(request.url)
    const testId = searchParams.get('testId')

    if (!testId) {
      return NextResponse.json(
        { error: 'ID de prueba requerido' },
        { status: 400 }
      )
    }

    const client = clients.find(c => c.id === clientId)
    if (!client) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    const testIndex = client.tests.findIndex(test => test.id === testId)
    if (testIndex === -1) {
      return NextResponse.json(
        { error: 'Prueba no encontrada' },
        { status: 404 }
      )
    }

    client.tests.splice(testIndex, 1)

    return NextResponse.json({
      success: true,
      message: 'Prueba eliminada exitosamente',
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Error al eliminar prueba' },
      { status: 500 }
    )
  }
}
