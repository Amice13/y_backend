const imagesController = require('../controllers/images')
const { uploadImage } = require('../helpers/helpers')

const API_VERSION = process.env.API_VERSION || '1.0'
const BASE_URL = `/${API_VERSION}`

module.exports = (app) => {

  // Test if API works
  app.get(BASE_URL + '/', imagesController.testAPI),

  // Upload and resize the image
  app.post(BASE_URL + '/resize', uploadImage, imagesController.resizeImage),

  // List resized images
  app.post(BASE_URL + '/list', imagesController.listImages),

  // Resize old image
  app.post(BASE_URL + '/resize-old', imagesController.resizeById)
}
