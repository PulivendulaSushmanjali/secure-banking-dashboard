const express = require('express');
const router = express.Router();
const TransactionController = require('../controllers/transactionController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, TransactionController.getTransactions);
router.post('/simulate', authMiddleware, TransactionController.simulateTransaction);

module.exports = router;
