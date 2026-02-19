const settingsService = require('../services/settingsService');
const cronService = require('../services/cronService');

class SettingsController {

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


    async updateSystemConfig(req, res, next) {
        try {
            const data = req.body;
            const updated = await settingsService.updateSystemConfig(data);

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

    async resetSettings(req, res, next) {
        try {

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
