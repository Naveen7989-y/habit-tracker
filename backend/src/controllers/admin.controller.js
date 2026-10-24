import { adminService } from '../services/admin.service.js';
import { successResponse } from '../utils/response.js';

export const adminController = {
  // Telemetry overview
  async getOverview(req, res, next) {
    try {
      const data = await adminService.getPlatformOverview();
      return successResponse(res, 200, 'Platform telemetry retrieved', data);
    } catch (err) {
      next(err);
    }
  },

  // Users
  async getUsers(req, res, next) {
    try {
      const data = await adminService.getUsers(req.query);
      return successResponse(res, 200, 'Users retrieved', data);
    } catch (err) {
      next(err);
    }
  },

  async updateUserRole(req, res, next) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const updated = await adminService.updateUserRole(id, role, req.user.id);
      return successResponse(res, 200, 'User role updated successfully', { user: updated });
    } catch (err) {
      next(err);
    }
  },

  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      const result = await adminService.deleteUser(id, req.user.id);
      return successResponse(res, 200, result.message);
    } catch (err) {
      next(err);
    }
  },

  // Site Content & CMS
  async getSiteContent(req, res, next) {
    try {
      const content = await adminService.getSiteContent();
      return successResponse(res, 200, 'Site content retrieved', { content });
    } catch (err) {
      next(err);
    }
  },

  async updateSiteContent(req, res, next) {
    try {
      const content = await adminService.updateSiteContent(req.body);
      return successResponse(res, 200, 'Site content updated successfully', { content });
    } catch (err) {
      next(err);
    }
  },

  // Food Catalogue
  async getCatalogueFoods(req, res, next) {
    try {
      const data = await adminService.getCatalogueFoods(req.query);
      return successResponse(res, 200, 'Catalogue foods retrieved', data);
    } catch (err) {
      next(err);
    }
  },

  async createCatalogueFood(req, res, next) {
    try {
      const food = await adminService.createCatalogueFood(req.body);
      return successResponse(res, 201, 'Food item added to catalogue', { food });
    } catch (err) {
      next(err);
    }
  },

  async updateCatalogueFood(req, res, next) {
    try {
      const { id } = req.params;
      const food = await adminService.updateCatalogueFood(id, req.body);
      return successResponse(res, 200, 'Food item updated', { food });
    } catch (err) {
      next(err);
    }
  },

  async deleteCatalogueFood(req, res, next) {
    try {
      const { id } = req.params;
      const result = await adminService.deleteCatalogueFood(id);
      return successResponse(res, 200, result.message);
    } catch (err) {
      next(err);
    }
  },
};
