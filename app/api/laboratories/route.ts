import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Esquemas de validación
const laboratorySchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  address: z.string().min(1, 'Dirección requerida'),
})

const machineSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  type: z.string().min(1, 'Tipo requerido'),
  status: z.enum(['operativa', 'no disponible']),
})

const recordSchema = z.object({
  testName: z.string().min(1, 'Nombre de prueba requerido'),
  date: z.string(),
  status: z.enum(['ordenada', 'en_proceso', 'completada', 'enviada']),
  notes: z.string().optional(),
  parameters: z.array(z.object({
    name: z.string(),
    value: z.string(),
    unit: z.string(),
    referenceMin: z.number(),
    referenceMax: z.number(),
    status: z.enum(['normal', 'high', 'low']),
  })).optional(),
})

// Datos iniciales (en producción esto estaría en una base de datos)
let laboratories = [
  {
    id: "1",
    name: "Lab Central Norte",
    address: "Av. Principal 123, Ciudad",
    machines: [
      {
        id: "1-1",
        name: "Analizador Hematológico",
        type: "Hematología",
        status: "operativa" as const,
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
                status: "normal" as const,
              },
            ],
            status: "completada" as const,
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
        status: "disponible" as const,
      },
    ],
  },
]

// GET - Obtener todos los laboratorios
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: laboratories,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener laboratorios' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo laboratorio
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = laboratorySchema.parse(body)

    const newLaboratory = {
      id: `lab-${Date.now()}`,
      ...validatedData,
      machines: [],
      inventory: [],
    }

    laboratories.push(newLaboratory)

    return NextResponse.json({
      success: true,
      data: newLaboratory,
      message: 'Laboratorio creado exitosamente',
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al crear laboratorio' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar laboratorio
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID de laboratorio requerido' },
        { status: 400 }
      )
    }

    const labIndex = laboratories.findIndex(lab => lab.id === id)
    if (labIndex === -1) {
      return NextResponse.json(
        { error: 'Laboratorio no encontrado' },
        { status: 404 }
      )
    }

    const validatedData = laboratorySchema.parse(updateData)
    laboratories[labIndex] = { ...laboratories[labIndex], ...validatedData }

    return NextResponse.json({
      success: true,
      data: laboratories[labIndex],
      message: 'Laboratorio actualizado exitosamente',
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al actualizar laboratorio' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar laboratorio
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID de laboratorio requerido' },
        { status: 400 }
      )
    }

    const labIndex = laboratories.findIndex(lab => lab.id === id)
    if (labIndex === -1) {
      return NextResponse.json(
        { error: 'Laboratorio no encontrado' },
        { status: 404 }
      )
    }

    laboratories.splice(labIndex, 1)

    return NextResponse.json({
      success: true,
      message: 'Laboratorio eliminado exitosamente',
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Error al eliminar laboratorio' },
      { status: 500 }
    )
  }
}
