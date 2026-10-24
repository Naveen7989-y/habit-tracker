import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Publicly accessible content endpoint for Landing Page & dynamic site elements
router.get('/public/content', adminController.getSiteContent);

// All subsequent routes require Authentication AND Administrator Role
router.use(authenticate, requireAdmin);

// Overview
router.get('/overview', adminController.getOverview);

// User Management
router.get('/users', adminController.getUsers);
router.put('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

// CMS & Page / Ad Content
router.get('/content', adminController.getSiteContent);
router.put('/content', adminController.updateSiteContent);

// Food Catalogue CMS
router.get('/foods', adminController.getCatalogueFoods);
router.post('/foods', adminController.createCatalogueFood);
router.put('/foods/:id', adminController.updateCatalogueFood);
router.delete('/foods/:id', adminController.deleteCatalogueFood);

export default router;
