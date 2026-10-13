const express = require('express');
const router = express.Router();
const AccountController = require('../controllers/accountController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, AccountController.getAccount);
router.get('/balance', authMiddleware, AccountController.getBalance);

module.exports = router;
