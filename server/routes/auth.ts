import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getDatabase } from '../database'
import { z } from 'zod'

const router = Router()

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

router.post('/login', (req, res) => {
  try {
    const { username, password } = loginSchema.parse(req.body)
    const db = getDatabase()

    db.get(
      'SELECT * FROM users WHERE username = ?',
      [username],
      (err, user: any) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' })
        }

        if (!user || !bcrypt.compareSync(password, user.password)) {
          return res.status(401).json({ error: 'Invalid credentials' })
        }

        const token = jwt.sign(
          { userId: user.id, username: user.username },
          process.env.JWT_SECRET || 'fallback-secret',
          { expiresIn: '24h' }
        )

        res.json({
          user: {
            id: user.id,
            username: user.username,
          },
          token,
        })
      }
    )
  } catch (error) {
    res.status(400).json({ error: 'Invalid request data' })
  }
})

export default router