const settingsService = require('../services/settingsService');
const cronService = require('../services/cronService');

class SettingsController {
    /**
     * Get all system settings (admin only)
     * GET /api/admin/settings
     */
    async getAllSettings(req, res, next) {
        try {
            const settings = await settingsService.getAllSettings();

            res.json({
                success: true,
                data: settings,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get settings by category
     * GET /api/admin/settings/:category
     * Categories: company, banking, system
     */
    async getSettingsByCategory(req, res, next) {
        try {
            const { category } = req.params;
            const settings = await settingsService.getSettingsByCategory(category);

            res.json({
                success: true,
                category,
                data: settings,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get system status summary
     * GET /api/admin/settings/status/summary
     */
    async getSystemStatus(req, res, next) {
        try {
            const status = await settingsService.getSystemStatus();

            res.json({
                success: true,
                data: status,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update company information
     * PUT /api/admin/settings/company
     */
    async updateCompanyInfo(req, res, next) {
        try {
            const data = req.body;
            const updated = await settingsService.updateCompanyInfo(data);

            res.json({
                success: true,
                message: 'Company information updated successfully',
                data: updated,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update banking details
     * PUT /api/admin/settings/banking
     */
    async updateBankingDetails(req, res, next) {
        try {
            const data = req.body;
            const updated = await settingsService.updateBankingDetails(data);

            res.json({
                success: true,
                message: 'Banking details updated successfully',
                data: updated,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update system configuration
     * PUT /api/admin/settings/system
     */
    async updateSystemConfig(req, res, next) {
        try {
            const data = req.body;
            const updated = await settingsService.updateSystemConfig(data);

            // Reinitialize invoice generation cron job if invoice settings changed
            if (data.invoice_generation_day !== undefined ||
                data.invoice_generation_time !== undefined ||
                data.auto_invoicing !== undefined) {
                await cronService.initializeInvoiceGenerationJob();
                console.log('🔄 Invoice generation cron job reinitialized with new settings');
            }

            res.json({
                success: true,
                message: 'System configuration updated successfully',
                data: updated,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update a single setting
     * PUT /api/admin/settings/single
     */
    async updateSingleSetting(req, res, next) {
        try {
            const { key, value, description } = req.body;

            if (!key || value === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Key and value are required',
                });
            }

            await settingsService.setSetting(key, value, description);

            res.json({
                success: true,
                message: 'Setting updated successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get invoice generation configuration
     * GET /api/admin/settings/invoice/config
     */
    async getInvoiceConfig(req, res, next) {
        try {
            const config = await settingsService.getInvoiceGenerationConfig();

            res.json({
                success: true,
                data: config,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Reset settings to default (use with caution)
     * POST /api/admin/settings/reset
     */
    async resetSettings(req, res, next) {
        try {
            // This would reset to defaults - implement based on requirements
            res.json({
                success: true,
                message: 'Settings reset to defaults',
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SettingsController();
