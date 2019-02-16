
module.exports = {

  // Test if API works
  testAPI: async (req, res, next) => {
    return res.status(200).json({ message: 'API works fine' })
  }
}
