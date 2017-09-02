const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const userController = require('../controllers/userController.js');
const authController = require('../controllers/authController.js');
const { catchErrors } = require('../handlers/errorHandlers');

//storeController routes
router.get('/', catchErrors(storeController.getStores));
router.get('/stores', catchErrors(storeController.getStores));
router.get('/add', authController.isLoggedIn, storeController.addStore);
router.post('/add',
            authController.isLoggedIn,
            storeController.upload, 
            catchErrors(storeController.resize),
            catchErrors(storeController.createStore));
router.get('/stores/:id/edit', authController.isLoggedIn, catchErrors(storeController.editStore));
router.post('/add/:id', 
            authController.isLoggedIn,
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
router.post('/register', 
            userController.validateRegister, 
            catchErrors(userController.addUser), 
            authController.login);
router.get('/logout', 
            authController.isLoggedIn, 
            authController.logout);
router.get('/account', 
            authController.isLoggedIn, 
            userController.account);
router.post('/account', 
            authController.isLoggedIn, 
            userController.updateAccount);
router.post('/account/forgot', catchErrors(authController.forgot));
router.get('/account/reset/:token', 
            catchErrors(authController.getUserFromToken), 
            catchErrors(authController.reset));
router.post('/account/reset/:token', 
            authController.confirmPassword, 
            catchErrors(authController.getUserFromToken), 
            catchErrors(authController.updatePassword));
router.get('/map', storeController.mapPage);

// APIs

router.get('/api/search', catchErrors(storeController.searchStores));
router.get('/api/stores/near', catchErrors(storeController.mapStores));

module.exports = router;