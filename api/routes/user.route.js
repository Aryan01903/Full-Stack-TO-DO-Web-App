const router = require('express').Router()
const authMW = require('../middleware/authMW')

const {register, login, getProfile, verifyProfile} = require('../controllers/user.controller')


router.post('/register', register)
router.post('verify-otp', verifyOtp)
router.get('/get-profile', authMW, getProfile)
router.post('/login', login)