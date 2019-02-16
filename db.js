const Datastore = require('nedb-promise')
const db = Datastore({ filename: './pics.db', autoload: true })

module.exports = db