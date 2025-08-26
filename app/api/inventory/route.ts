import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Esquemas de validación
const inventoryItemSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  category: z.string().min(1, 'Categoría requerida'),
  quantity: z.number().min(0, 'Cantidad debe ser mayor o igual a 0'),
  unit: z.string().min(1, 'Unidad requerida'),
  minStock: z.number().min(0, 'Stock mínimo debe ser mayor o igual a 0'),
  expirationDate: z.string().min(1, 'Fecha de expiración requerida'),
  supplier: z.string().min(1, 'Proveedor requerido'),
  notes: z.string().optional(),
  status: z.enum(['disponible', 'bajo_stock', 'agotado', 'vencido']),
})

// Datos iniciales (en producción esto estaría en una base de datos)
let laboratories = [
  {
    id: "1",
    name: "Lab Central Norte",
    address: "Av. Principal 123, Ciudad",
    machines: [],
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
      {
        id: "inv-2",
        name: "Reactivos para hemograma",
        category: "Reactivos",
        quantity: 25,
        unit: "botellas",
        minStock: 30,
        expirationDate: "2024-06-15",
        supplier: "ChemLab Solutions",
        notes: "Reactivos específicos para análisis hematológico",
        status: "bajo_stock" as const,
      },
      {
        id: "inv-3",
        name: "Guantes de látex",
        category: "Equipo de protección",
        quantity: 0,
        unit: "cajas",
        minStock: 10,
        expirationDate: "2026-03-20",
        supplier: "SafetyFirst Inc.",
        notes: "Guantes tamaño M y L",
        status: "agotado" as const,
      },
    ],
  },
  {
    id: "2",
    name: "Lab Sur",
    address: "Calle Sur 456, Ciudad",
    machines: [],
    inventory: [
      {
        id: "inv-4",
        name: "Microscopios",
        category: "Equipos",
        quantity: 3,
        unit: "unidades",
        minStock: 2,
        expirationDate: "2030-01-01",
        supplier: "Optical Systems",
        notes: "Microscopios de alta resolución",
        status: "disponible" as const,
      },
    ],
  },
]

// GET - Obtener inventario de todos los laboratorios o de uno específico
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const labId = searchParams.get('labId')

    if (labId) {
      const laboratory = laboratories.find(lab => lab.id === labId)
      if (!laboratory) {
        return NextResponse.json(
          { error: 'Laboratorio no encontrado' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: laboratory.inventory,
      })
    }

    // Obtener inventario de todos los laboratorios
    const allInventory = laboratories.map(lab => ({
      labId: lab.id,
      labName: lab.name,
      inventory: lab.inventory,
    }))

    return NextResponse.json({
      success: true,
      data: allInventory,
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener inventario' },
      { status: 500 }
    )
  }
}

// POST - Agregar item al inventario
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { labId, ...itemData } = body

    if (!labId) {
      return NextResponse.json(
        { error: 'ID de laboratorio requerido' },
        { status: 400 }
      )
    }

    const validatedData = inventoryItemSchema.parse(itemData)
    const laboratory = laboratories.find(lab => lab.id === labId)

    if (!laboratory) {
      return NextResponse.json(
        { error: 'Laboratorio no encontrado' },
        { status: 404 }
      )
    }

    const newItem = {
      id: `inv-${Date.now()}`,
      ...validatedData,
    }

    laboratory.inventory.push(newItem)

    return NextResponse.json({
      success: true,
      data: newItem,
      message: 'Item agregado al inventario exitosamente',
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al agregar item al inventario' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar item del inventario
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { labId, itemId, ...updateData } = body

    if (!labId || !itemId) {
      return NextResponse.json(
        { error: 'ID de laboratorio e item requeridos' },
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

    const itemIndex = laboratory.inventory.findIndex(item => item.id === itemId)
    if (itemIndex === -1) {
      return NextResponse.json(
        { error: 'Item no encontrado' },
        { status: 404 }
      )
    }

    const validatedData = inventoryItemSchema.partial().parse(updateData)
    laboratory.inventory[itemIndex] = { 
      ...laboratory.inventory[itemIndex], 
      ...validatedData 
    }

    return NextResponse.json({
      success: true,
      data: laboratory.inventory[itemIndex],
      message: 'Item actualizado exitosamente',
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al actualizar item' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar item del inventario
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const labId = searchParams.get('labId')
    const itemId = searchParams.get('itemId')

    if (!labId || !itemId) {
      return NextResponse.json(
        { error: 'ID de laboratorio e item requeridos' },
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

    const itemIndex = laboratory.inventory.findIndex(item => item.id === itemId)
    if (itemIndex === -1) {
      return NextResponse.json(
        { error: 'Item no encontrado' },
        { status: 404 }
      )
    }

    laboratory.inventory.splice(itemIndex, 1)

    return NextResponse.json({
      success: true,
      message: 'Item eliminado exitosamente',
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Error al eliminar item' },
      { status: 500 }
    )
  }
}
