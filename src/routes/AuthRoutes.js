const express = require('express');
const router = express.Router();
const {signUp, signIn, verifyCode, resendVerificationCode, twoFactorAuthentication, resendPhoneVerificationCode } = require('../controllers/AuthController');


router.post('/signup', signUp);
router.post('/signin', signIn);
router.post('/verify', verifyCode);
router.post('/resend', resendVerificationCode);
router.post('/2fa', twoFactorAuthentication);
router.post('/2fa/resend', resendPhoneVerificationCode);

module.exports = router;
