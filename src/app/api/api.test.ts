import { describe, it, expect } from 'vitest'

describe('API Routes', () => {
  describe('GET /api/agents', () => {
    it('should return agents list', async () => {
      const res = await fetch('http://localhost:3000/api/agents')
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toHaveProperty('agents')
      expect(Array.isArray(data.agents)).toBe(true)
    })
  })

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const res = await fetch('http://localhost:3000/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Task',
          description: 'Test description',
          priority: 'medium',
          assignedAgentId: 'bulma'
        })
      })
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.success).toBe(true)
    })

    it('should reject missing title', async () => {
      const res = await fetch('http://localhost:3000/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedAgentId: 'bulma'
        })
      })
      expect(res.status).toBe(400)
    })
  })
})
