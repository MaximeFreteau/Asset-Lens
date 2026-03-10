/* eslint-disable @typescript-eslint/no-explicit-any */
// frontend/lib/api.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001'

export async function fetchAssets(params?: { type?: string; search?: string }) {
  const query = new URLSearchParams()
  if (params?.type)   query.append('type', params.type)
  if (params?.search) query.append('search', params.search)
  const qs = query.toString()
  const res = await fetch(`${BASE_URL}/api/assets${qs ? `?${qs}` : ''}`, {
    cache: 'no-store'
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function fetchScenes() {
  const res = await fetch(`${BASE_URL}/api/scenes`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function fetchAsset(id: string) {
  const res = await fetch(`${BASE_URL}/api/assets/${id}`)
  return res.json()
}

export async function fetchScene(id: string) {
  const url = `${BASE_URL}/api/scenes/${id}`
  console.log('Fetching scene:', url)
  const res = await fetch(url)
  console.log('Response status:', res.status)
  console.log('Response content-type:', res.headers.get('content-type'))
  const text = await res.text()
  console.log('Response body:', text.slice(0, 200))
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return JSON.parse(text)
}

export async function fetchDoc(entityType: string, entityId: string) {
  const res = await fetch(`${BASE_URL}/api/docs/entity/${entityType}/${entityId}`)
  return res.json()
}

export async function createDoc(data: {
  title: string
  content: string
  template_type: string
  entity_type: string
  entity_id: string
}) {
  const res = await fetch(`${BASE_URL}/api/docs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return res.json()
}

export async function updateDoc(id: string, content: string) {
  const res = await fetch(`${BASE_URL}/api/docs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  })
  return res.json()
}

export async function syncScene(data: object) {
  const res = await fetch(`${BASE_URL}/api/scenes/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return res.json()
}

export async function syncAsset(data: {
  name: string
  path: string
  asset_type: string
  metadata: object
}) {
  const res = await fetch(`${BASE_URL}/api/assets/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function fetchTasks(params?: { status?: string, assigned_to?: string }) {
  const query = new URLSearchParams(params as any).toString()
  const res = await fetch(`${BASE_URL}/api/tasks${query ? `?${query}` : ''}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function fetchTask(id: string) {
  const res = await fetch(`${BASE_URL}/api/tasks/${id}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function createTask(data: object) {
  const res = await fetch(`${BASE_URL}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function updateTask(id: string, data: object) {
  const res = await fetch(`${BASE_URL}/api/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function updateTaskStatus(id: string, status: string) {
  const res = await fetch(`${BASE_URL}/api/tasks/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function fetchUsers() {
  const res = await fetch(`${BASE_URL}/api/users`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function createUser(data: { name: string; role: string }) {
  const res = await fetch(`${BASE_URL}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function addTaskReference(taskId: string, data: { url?: string; image_url?: string; note?: string }) {
  const res = await fetch(`${BASE_URL}/api/tasks/${taskId}/references`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function addTaskComment(taskId: string, data: { content: string; author_id: string }) {
  const res = await fetch(`${BASE_URL}/api/tasks/${taskId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}