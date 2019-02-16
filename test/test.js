const chai = require('chai')
const chaiHttp = require('chai-http')
const rimraf = require('rimraf')
const fs = require('fs')
const server = require('../index')
const { should, expect } = chai
const { parseJWT } = require('../helpers/helpers')
const db = require('../db')

chai.use(chaiHttp)

const IMAGE_FOLDER = process.env.IMAGE_FOLDER || 'user-images'
const RESIZED_FOLDER = process.env.RESIZED_FOLDER || 'user-resized'
const API_VERSION = process.env.API_VERSION || '1.0'
const BASE_URL = `/${API_VERSION}`
const TEST_IMAGE = './test/test.jpg'
const USER = 'Yalantis'
const RESIZED_IMAGE_PATH = `test-resized/${USER}/200x200 - test.jpg`
const USER_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJpbWFnZVJlc2l6ZXIiLCJuYW1lIjoiWWFsYW50aXMiLCJpYXQiOjE1MTYyMzkwMjJ9.nNN_ygUTBHWe19mOmshfbodf9klkeH8HThrBrPKGGc0'

describe('Images ', () => {
  before(() => {
    if (!fs.existsSync(IMAGE_FOLDER)) fs.mkdirSync(IMAGE_FOLDER)
  })

  describe('upload: ', () => {
    it('/resize - POST image without authorization returns error', async () => {
      let res = await chai.
        request(server).
        post(`${BASE_URL}/resize`).
        field('width', 200).
        attach('image', TEST_IMAGE, 'test.jpg')

      res.should.have.status(401)
      res.should.have.property('error')
      res.error.should.have.property('text')
      res.error.should.have.property('text').eql('Missing Authorization Header or authorization Header does not include a username')
    })

    it('/resize - POST image without height returns error', async () => {
      let res = await chai.
        request(server).
        post(`${BASE_URL}/resize`).
        set('Authorization', `Bearer ${USER_JWT}`).
        field('width', 200).
        attach('image', TEST_IMAGE, 'test.jpg')

      res.should.have.status(422)
      res.should.have.property('error')
      res.error.should.have.property('text')
      res.error.should.have.property('text').eql('New image height has not been set')
    })

    it('/resize - POST body without image returns error', async () => {
      let res = await chai.
        request(server).
        post(`${BASE_URL}/resize`).
        set('Authorization', `Bearer ${USER_JWT}`).
        field('height', 200).
        field('width', 200)

      res.should.have.status(422)
      res.should.have.property('error')
      res.error.should.have.property('text')
      res.error.should.have.property('text').eql('No image has been uploaded')
    })

    it('/resize - POST image with all properties returns a downloadable link with image height and width and save metainformaton to the database', async () => {
      let res = await chai.
        request(server).
        post(`${BASE_URL}/resize`).
        set('Authorization', `Bearer ${USER_JWT}`).
        field('height', 200).
        field('width', 200).
        attach('image', TEST_IMAGE, 'test.jpg')

      res.should.have.status(200)
      res.body.should.have.property('height')
      res.body.should.have.property('width')
      res.body.should.have.property('link')

      // File is generated and downloadable
      let resFile = await chai.
        request(server).
        get(`/${RESIZED_IMAGE_PATH}`)

      resFile.should.have.status(200)
      expect(resFile.body).to.be.instanceof(Buffer)

      // Information about file is stored in the database
      let entities = await db.find({ user: USER, path: RESIZED_IMAGE_PATH })
      expect(entities).to.be.an('array')
      expect(entities.length).to.equal(1)
    })
  })

  describe('list: ', () => {

    it('/list POST - without authorization returns error', async () => {
      let res = await chai.
        request(server).
        post(`${BASE_URL}/list`)

      res.should.have.status(401)
      res.should.have.property('error')
      res.error.should.have.property('text')
      res.error.should.have.property('text').eql('Missing Authorization Header or authorization Header does not include a username')
    })

    it('/list - POST returns list of images resized by the user', async () => {
      await chai.request(server).post(`${BASE_URL}/resize`).set('Authorization', `Bearer ${USER_JWT}`).
        field('height', 400).field('width', 600).attach('image', TEST_IMAGE, 'test.jpg')

      let res = await chai.
        request(server).
        post(`${BASE_URL}/list`).
        set('Authorization', `Bearer ${USER_JWT}`)

      res.should.have.status(200)
      expect(res.body).to.be.an('array')
      expect(res.body.length).to.equal(2)
    })
  })

  after(async () => {
    rimraf(IMAGE_FOLDER, () => null)
    rimraf(RESIZED_FOLDER, () => null)
    db.remove({ user: USER }, { multi: true }, () => null)
  })
})
