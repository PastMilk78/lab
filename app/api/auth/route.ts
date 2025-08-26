import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Esquemas de validación
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
})

// Datos de usuarios (en producción esto estaría en una base de datos)
const users = [
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    // Buscar usuario
    const user = users.find(u => u.email === email && u.password === password)

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // En producción, aquí generarías un JWT token
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      message: 'Login exitoso'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  // Logout - en producción invalidarías el token
  return NextResponse.json({
    success: true,
    message: 'Logout exitoso'
  })
}
