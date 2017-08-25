const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const userController = require('../controllers/userController.js');
const authController = require('../controllers/authController.js');
const { catchErrors } = require('../handlers/errorHandlers');

//storeController routes
router.get('/', catchErrors(storeController.getStores));
router.get('/stores', catchErrors(storeController.getStores));
router.get('/add', storeController.addStore);
router.post('/add', 
            storeController.upload, 
            catchErrors(storeController.resize),
            catchErrors(storeController.createStore));
router.get('/stores/:id/edit', catchErrors(storeController.editStore));
router.post('/add/:id', 
            storeController.upload, 
            catchErrors(storeController.resize),
            catchErrors(storeController.updateStore));
router.get('/store/:slug', catchErrors(storeController.getStoreBySlug));
router.get('/tags', catchErrors(storeController.getStoresByTags));
router.get('/tags/:tag', catchErrors(storeController.getStoresByTags));

//userController routes
router.get('/login', userController.loginForm);
router.post('/login', authController.login);
router.get('/register', userController.registerForm);
router.post('/register', userController.validateRegister, catchErrors(userController.addUser), authController.login);
router.get('/logout', authController.logout);

module.exports = router;