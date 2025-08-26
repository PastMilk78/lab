import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Esquemas de validación
const clientSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(1, 'Teléfono requerido'),
})

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

// GET - Obtener todos los clientes
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: clients,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener clientes' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo cliente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = clientSchema.parse(body)

    const newClient = {
      id: `client-${Date.now()}`,
      ...validatedData,
      tests: [],
    }

    clients.push(newClient)

    return NextResponse.json({
      success: true,
      data: newClient,
      message: 'Cliente creado exitosamente',
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al crear cliente' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar cliente
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID de cliente requerido' },
        { status: 400 }
      )
    }

    const clientIndex = clients.findIndex(client => client.id === id)
    if (clientIndex === -1) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    const validatedData = clientSchema.parse(updateData)
    clients[clientIndex] = { ...clients[clientIndex], ...validatedData }

    return NextResponse.json({
      success: true,
      data: clients[clientIndex],
      message: 'Cliente actualizado exitosamente',
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al actualizar cliente' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar cliente
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID de cliente requerido' },
        { status: 400 }
      )
    }

    const clientIndex = clients.findIndex(client => client.id === id)
    if (clientIndex === -1) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    clients.splice(clientIndex, 1)

    return NextResponse.json({
      success: true,
      message: 'Cliente eliminado exitosamente',
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Error al eliminar cliente' },
      { status: 500 }
    )
  }
}
