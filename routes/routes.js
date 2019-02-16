const imagesController = require('../controllers/images')

const API_VERSION = process.env.API_VERSION || '1.0'
const BASE_URL = `/${API_VERSION}`

module.exports = (app) => {

  // Test if API works
  app.get(BASE_URL + '/', imagesController.testAPI)
}
