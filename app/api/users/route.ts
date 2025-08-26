import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Esquemas de validación
const userSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  role: z.string().min(1, 'Rol requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
  labId: z.string().optional(),
  permissions: z.array(z.string()).optional(),
})

const updateUserSchema = userSchema.partial().omit({ password: true })

// Datos iniciales (en producción esto estaría en una base de datos)
let users = [
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

// Roles y permisos predefinidos
const rolePermissions = {
  Admin: [
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
  "Jefe de Lab": [
    "manage_labs",
    "view_all", 
    "assign_tests",
    "manage_inventory",
    "view_activities"
  ],
  Técnico: [
    "view_assigned",
    "update_tests",
    "view_inventory"
  ],
  Patóloga: [
    "view_results",
    "approve_tests",
    "view_all"
  ],
}

// GET - Obtener usuarios
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const labId = searchParams.get('labId')
    const onlineOnly = searchParams.get('onlineOnly') === 'true'

    let filteredUsers = [...users]

    // Filtrar por rol
    if (role) {
      filteredUsers = filteredUsers.filter(user => user.role === role)
    }

    // Filtrar por laboratorio
    if (labId) {
      filteredUsers = filteredUsers.filter(user => user.labId === labId)
    }

    // Filtrar solo usuarios en línea
    if (onlineOnly) {
      filteredUsers = filteredUsers.filter(user => user.isOnline)
    }

    // No devolver contraseñas
    const usersWithoutPasswords = filteredUsers.map(({ password, ...user }) => user)

    return NextResponse.json({
      success: true,
      data: usersWithoutPasswords,
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo usuario
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = userSchema.parse(body)

    // Verificar que el email no esté duplicado
    const existingUser = users.find(user => user.email === validatedData.email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      )
    }

    // Asignar permisos basados en el rol si no se especifican
    const permissions = validatedData.permissions || rolePermissions[validatedData.role as keyof typeof rolePermissions] || []

    const newUser = {
      id: `user-${Date.now()}`,
      ...validatedData,
      permissions,
      isOnline: false,
    }

    users.push(newUser)

    // No devolver la contraseña
    const { password, ...userWithoutPassword } = newUser

    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
      message: 'Usuario creado exitosamente',
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al crear usuario' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar usuario
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID de usuario requerido' },
        { status: 400 }
      )
    }

    const userIndex = users.findIndex(user => user.id === id)
    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    const validatedData = updateUserSchema.parse(updateData)

    // Verificar que el email no esté duplicado (si se está actualizando)
    if (validatedData.email) {
      const existingUser = users.find(user => user.email === validatedData.email && user.id !== id)
      if (existingUser) {
        return NextResponse.json(
          { error: 'El email ya está registrado' },
          { status: 400 }
        )
      }
    }

    // Actualizar permisos si se cambió el rol
    if (validatedData.role && !validatedData.permissions) {
      validatedData.permissions = rolePermissions[validatedData.role as keyof typeof rolePermissions] || []
    }

    users[userIndex] = { ...users[userIndex], ...validatedData }

    // No devolver la contraseña
    const { password, ...userWithoutPassword } = users[userIndex]

    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
      message: 'Usuario actualizado exitosamente',
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar usuario
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID de usuario requerido' },
        { status: 400 }
      )
    }

    const userIndex = users.findIndex(user => user.id === id)
    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    users.splice(userIndex, 1)

    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado exitosamente',
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Error al eliminar usuario' },
      { status: 500 }
    )
  }
}
