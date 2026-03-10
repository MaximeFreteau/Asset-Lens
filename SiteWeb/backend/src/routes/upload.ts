import { Router } from 'express'
import multer from 'multer'
import * as pdfParse from 'pdf-parse'
import mammoth from 'mammoth'
import path from 'path'
import fs from 'fs'

const router = Router()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const ext = path.extname(file.originalname)
    cb(null, `${unique}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg',
      'image/jpg',
    ]
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Type de fichier non supporté'))
    }
  },
})

router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier' })

  const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:3001'
  const fileUrl    = `${backendUrl}/uploads/${req.file.filename}`
  const fileType   = path.extname(req.file.originalname).replace('.', '').toLowerCase()
  let extractedText = ''

  try {
    if (fileType === 'pdf') {
      const buffer = fs.readFileSync(req.file.path)
      const data = await (pdfParse as any)(buffer)
      extractedText = data.text
    } else if (fileType === 'docx') {
      const result  = await mammoth.extractRawText({ path: req.file.path })
      extractedText = result.value
    }
  } catch (err) {
    console.error('Text extraction error:', err)
  }

  res.json({
    url:           fileUrl,
    filename:      req.file.originalname,
    type:          fileType,
    size:          req.file.size,
    extracted_text: extractedText,
  })
})

export default router