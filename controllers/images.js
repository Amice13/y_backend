const { getUser, resizeImage } = require('../helpers/helpers')
const db = require('../db')

let HOST_URL = process.env.HOST || 'http://localhost'
const PORT = process.env.PORT || 3000
HOST_URL += ':' + PORT

module.exports = {

  // Test if API works
  testAPI: async (req, res, next) => {
    return res.status(200).json({ message: 'API works fine' })
  },

  // Upload and resize the image
  resizeImage: async (req, res, next) => {
    // Check if user is authorized
    let user = authorize(req, res, next)
    if (!user) return res.status(401).send('Missing Authorization Header or authorization Header does not include a username')

    // Check if file is uploaded
    if (!req.file) return res.status(422).send('No image has been uploaded')

    // Check if we have sizes
    let { width, height } = req.body
    if (!width) return res.status(422).send('New image width has not been set')
    if (!height) return res.status(422).send('New image height has not been set')
    width = parseInt(width)
    height = parseInt(height)
    if (isNaN(width)) return res.status(422).send('New image width is not a number')
    if (isNaN(height)) return res.status(422).send('New image height is not a number')
    let { originalname, path } = req.file
    let createdAt = new Date()

    // Resize image
    let resized = await resizeImage(path, width, height, user, originalname)

    // Save information about image to database
    let image = {
      createdAt,
      user,
      originalname,
      filename: resized.filename,
      width: resized.width,
      height: resized.height,
      path: resized.path }

    try {
      await db.insert(image)
    } catch (error) {
      return res.status(500).send(error)
    }

    // Return image link to user
    image.link = `${HOST_URL}/${image.path}`
    image = {...['link', 'height', 'width'].reduce((mem, key) => ({ ...mem, [key]: image[key] }), {})}
    return res.status(200).json(image)
  },

  listImages: async (req, res, next) => {
    // Check if user is authorized
    let user = authorize(req, res, next)
    if (!user) return res.status(401).send('Missing Authorization Header or authorization Header does not include a username')

    // Simple pagination
    let { skip } = req.body
    if (!skip) skip = 0

    let result
    try {
      result = await db.cfind({ user }, { filename: 1, width: 1, height: 1, _id: 1 }).skip(skip).limit(20).exec()
    } catch (error) {
      return res.status(500).send(error)
    }
    return res.status(200).json(result)
  }

}

const authorize = (req, res, next) => {
  let token = req.headers.authorization
  if (!token || token.indexOf('Bearer ') === -1) return null
  let user = getUser(token)
  return user
}
