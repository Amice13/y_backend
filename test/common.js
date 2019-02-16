const chai = require('chai')
const chaiHttp = require('chai-http')
chai.use(chaiHttp)
const server = require('../index')
const should = chai.should()

const API_VERSION = process.env.API_VERSION || '1.0'
const BASE_URL = `/${API_VERSION}`

describe('General test ', () => {
  it('/ GET base url returns status 200', async () => {
    let res = await chai.request(server).get(BASE_URL)
    res.should.have.status(200)
    res.body.should.have.property('message')
    res.body.should.have.property('message').eql('API works fine')
  })
})
