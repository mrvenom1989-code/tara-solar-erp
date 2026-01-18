// src/app/actions/auth.ts
'use server'

import { createClient } from '@supabase/supabase-js'

// Helper to get Admin Client
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// 1. CREATE USER
export async function createNewUser(prevState: any, formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const role = formData.get('role') as string
  const password = formData.get('password') as string

  const supabaseAdmin = getAdminClient()

  // A. Create Auth User (Login)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true
  })

  if (authError) return { success: false, message: authError.message }

  // B. Create Public Profile
  if (authData.user) {
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        name: name,
        email: email,
        role: role,
        status: 'Active'
      })

    if (profileError) return { success: false, message: "Login created, but profile failed: " + profileError.message }
  }

  return { success: true, message: "User created successfully!" }
}

// 2. DELETE USER
export async function deleteUser(email: string) {
  const supabaseAdmin = getAdminClient()

  // A. Find Auth ID by Email
  // (Since we didn't store UUID in public.users, we look it up by email)
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
  const user = users.find(u => u.email === email)

  if (user) {
    // B. Delete from Auth (Login)
    await supabaseAdmin.auth.admin.deleteUser(user.id)
  }

  // C. Delete from Public (Profile)
  const { error } = await supabaseAdmin.from('users').delete().eq('email', email)

  if (error) return { success: false, message: error.message }
  return { success: true, message: "User deleted successfully" }
}

// 3. UPDATE USER DETAILS
export async function updateUser(id: number, name: string, role: string, status: string) {
  const supabaseAdmin = getAdminClient()

  const { error } = await supabaseAdmin
    .from('users')
    .update({ name, role, status })
    .eq('id', id)

  if (error) return { success: false, message: error.message }
  return { success: true, message: "User updated successfully" }
}

// 4. RESET PASSWORD
export async function resetUserPassword(email: string, newPassword: string) {
  const supabaseAdmin = getAdminClient()

  // A. Find Auth ID
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
  const user = users.find(u => u.email === email)

  if (!user) return { success: false, message: "User not found in Auth system" }

  // B. Update Password
  const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    password: newPassword
  })

  if (error) return { success: false, message: error.message }
  return { success: true, message: "Password updated successfully" }
}