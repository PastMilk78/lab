import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Esquemas de validación
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
    inventory: [],
  },
]

// GET - Obtener máquinas de un laboratorio
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const labId = params.id
    const laboratory = laboratories.find(lab => lab.id === labId)

    if (!laboratory) {
      return NextResponse.json(
        { error: 'Laboratorio no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: laboratory.machines,
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener máquinas' },
      { status: 500 }
    )
  }
}

// POST - Agregar máquina a un laboratorio
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const labId = params.id
    const body = await request.json()
    const validatedData = machineSchema.parse(body)

    const laboratory = laboratories.find(lab => lab.id === labId)
    if (!laboratory) {
      return NextResponse.json(
        { error: 'Laboratorio no encontrado' },
        { status: 404 }
      )
    }

    const newMachine = {
      id: `machine-${Date.now()}`,
      ...validatedData,
      records: [],
    }

    laboratory.machines.push(newMachine)

    return NextResponse.json({
      success: true,
      data: newMachine,
      message: 'Máquina agregada exitosamente',
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al agregar máquina' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar máquina
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const labId = params.id
    const body = await request.json()
    const { machineId, ...updateData } = body

    if (!machineId) {
      return NextResponse.json(
        { error: 'ID de máquina requerido' },
        { status: 400 }
      )
    }

    const laboratory = laboratories.find(lab => lab.id === labId)
    if (!laboratory) {
      return NextResponse.json(
        { error: 'Laboratorio no encontrado' },
        { status: 404 }
      )
    }

    const machineIndex = laboratory.machines.findIndex(machine => machine.id === machineId)
    if (machineIndex === -1) {
      return NextResponse.json(
        { error: 'Máquina no encontrada' },
        { status: 404 }
      )
    }

    const validatedData = machineSchema.parse(updateData)
    laboratory.machines[machineIndex] = { 
      ...laboratory.machines[machineIndex], 
      ...validatedData 
    }

    return NextResponse.json({
      success: true,
      data: laboratory.machines[machineIndex],
      message: 'Máquina actualizada exitosamente',
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al actualizar máquina' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar máquina
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const labId = params.id
    const { searchParams } = new URL(request.url)
    const machineId = searchParams.get('machineId')

    if (!machineId) {
      return NextResponse.json(
        { error: 'ID de máquina requerido' },
        { status: 400 }
      )
    }

    const laboratory = laboratories.find(lab => lab.id === labId)
    if (!laboratory) {
      return NextResponse.json(
        { error: 'Laboratorio no encontrado' },
        { status: 404 }
      )
    }

    const machineIndex = laboratory.machines.findIndex(machine => machine.id === machineId)
    if (machineIndex === -1) {
      return NextResponse.json(
        { error: 'Máquina no encontrada' },
        { status: 404 }
      )
    }

    laboratory.machines.splice(machineIndex, 1)

    return NextResponse.json({
      success: true,
      message: 'Máquina eliminada exitosamente',
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Error al eliminar máquina' },
      { status: 500 }
    )
  }
}
