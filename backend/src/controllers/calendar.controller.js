import { CalendarService } from '../services/calendar.service.js';

export class CalendarController {
  /**
   * GET /api/calendar/month?year=2026&month=10
   */
  static async getMonthCalendar(req, res, next) {
    try {
      const { year, month } = req.query;
      const data = await CalendarService.getMonthCalendar(req.user.id, year, month);

      return res.status(200).json({
        status: 'success',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/calendar/heatmap?days=90
   */
  static async getHeatmap(req, res, next) {
    try {
      const { days } = req.query;
      const data = await CalendarService.getHeatmap(req.user.id, days);

      return res.status(200).json({
        status: 'success',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/calendar/day/:date
   */
  static async getDayDetails(req, res, next) {
    try {
      const { date } = req.params;
      const data = await CalendarService.getDayDetails(req.user.id, date);

      return res.status(200).json({
        status: 'success',
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}
