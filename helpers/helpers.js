const fs = require('fs')
const multer = require('multer')
const sharp = require('sharp')

const IMAGE_FOLDER = process.env.IMAGE_FOLDER || 'user-images'
const RESIZED_FOLDER = process.env.RESIZED_FOLDER || 'user-resized'

// Create image folder if not exists
if (!fs.existsSync(IMAGE_FOLDER)) fs.mkdirSync(IMAGE_FOLDER)
if (!fs.existsSync(RESIZED_FOLDER)) fs.mkdirSync(RESIZED_FOLDER)

// Set otpions for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, `./${IMAGE_FOLDER}/`)
  }
})

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/tiff']
const fileFilter = (req, file, cb) => {
  if (!allowedMimeTypes.includes(file.mimetype)) cb(new Error('Uploaded file is not an image'))
  cb(null, true)
}

const limits = { fileSize: 1024 * 1024 * 5}
const upload = multer({ storage, fileFilter, limits, preservePath: true })
const uploadImage = upload.single('image')

// Parse payload of JSON Web Token
const parseJWT = (token) => {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
  } catch (err) {
    console.log(err)
    return null
  }
}

const getUser = (str) => {
  let jwt = str.match(/Bearer (.*)/)
  if (!jwt) return null
  let token = jwt[0]
  let user = parseJWT(token)
  if (!user) return null
  return user.name
}

// Image resizer
const resizeImage = async (file, width, height, user, filename) => {
  filename = `${width}x${height} - ${filename}`
  let destination = `${RESIZED_FOLDER}/${user}`
  let path = `${destination}/${filename}`
  if (!fs.existsSync(destination)) fs.mkdirSync(destination)

  try {
    let resized = await sharp(file).resize(width, height).toFile(path)

    // Remove unnecessary initial file
    fs.unlink(file, () => null)
    return { path, filename, width: resized.width, height: resized.height }
  } catch (err) {
    console.log(err)
    return err
  }
}

module.exports = {
  uploadImage,
  parseJWT,
  getUser,
  resizeImage
}
