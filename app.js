const express = require('express')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const expressSanitizer = require('express-sanitizer')
const RESIZED_FOLDER = process.env.RESIZED_FOLDER || 'user-resized'
const routes = require('./routes/routes')

const app = express()

const NODE_ENV = process.env.NODE_ENV

if (NODE_ENV !== 'test') {
  app.use(morgan('combined'))
}

// Middlewares
app.use(bodyParser.json({limit: '1mb'}))
app.use(bodyParser.urlencoded({limit: '5mb', extended: true}))
app.use(expressSanitizer())
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, PATCH, DELETE')
    return res.status(200).json({})
  }
  next()
})

// Static folder
app.use(`/${RESIZED_FOLDER}`, express.static(RESIZED_FOLDER))
// Routes
routes(app)

app.use((err, req, res, next) => {
  res.status(422).send({ error: err.message })
})

module.exports = app
