const prisma = require('../config/database');

class SettingsService {

    async getAllSettings() {
        const [company, banking, system] = await Promise.all([
            prisma.companyInformation.findFirst(),
            prisma.bankingDetails.findFirst(),
            prisma.systemConfiguration.findFirst(),
        ]);

        return {
            company: company ? {
                name: company.name,
                vat_number: company.vatNumber,
                primary_phone: company.primaryPhone,
                alternative_phone: company.alternativePhone,
                email: company.email,
                website: company.website,
                address: company.address,
                founded_year: company.foundedYear,
            } : {},
            banking: banking ? {
                bank_name: banking.bankName,
                account_holder: banking.accountHolder,
                sort_code: banking.sortCode,
                account_number: banking.accountNumber,
                payment_terms: banking.paymentTerms,
            } : {},
            system: system ? {
                invoice_generation_day: system.invoiceGenerationDay,
                invoice_generation_time: system.invoiceGenerationTime,
                session_timeout: system.sessionTimeout.toString(),
                auto_invoicing: system.autoInvoicing.toString(),
                email_notifications: system.emailNotifications.toString(),
                sms_notifications: system.smsNotifications.toString(),
                maps_api_enabled: system.mapsApiEnabled.toString(),
            } : {},
        };
    }

    async getSettingsByCategory(category) {
        switch (category.toLowerCase()) {
            case 'company': {
                const company = await prisma.companyInformation.findFirst();
                return company ? {
                    name: company.name,
                    vat_number: company.vatNumber,
                    primary_phone: company.primaryPhone,
                    alternative_phone: company.alternativePhone,
                    email: company.email,
                    website: company.website,
                    address: company.address,
                    founded_year: company.foundedYear,
                } : {};
            }
            case 'banking': {
                const banking = await prisma.bankingDetails.findFirst();
                return banking ? {
                    bank_name: banking.bankName,
                    account_holder: banking.accountHolder,
                    sort_code: banking.sortCode,
                    account_number: banking.accountNumber,
                    payment_terms: banking.paymentTerms,
                } : {};
            }
            case 'system': {
                const system = await prisma.systemConfiguration.findFirst();
                return system ? {
                    invoice_generation_day: system.invoiceGenerationDay,
                    invoice_generation_time: system.invoiceGenerationTime,
                    session_timeout: system.sessionTimeout.toString(),
                    auto_invoicing: system.autoInvoicing.toString(),
                    email_notifications: system.emailNotifications.toString(),
                    sms_notifications: system.smsNotifications.toString(),
                    maps_api_enabled: system.mapsApiEnabled.toString(),
                } : {};
            }
            default:
                throw new Error('Invalid category. Must be: company, banking, or system');
        }
    }

    async updateCompanyInfo(data) {
        const updateData = {};

        if (data.name !== undefined) updateData.name = data.name;
        if (data.vat_number !== undefined) updateData.vatNumber = data.vat_number;
        if (data.primary_phone !== undefined) updateData.primaryPhone = data.primary_phone;
        if (data.alternative_phone !== undefined) updateData.alternativePhone = data.alternative_phone;
        if (data.email !== undefined) updateData.email = data.email;
        if (data.website !== undefined) updateData.website = data.website;
        if (data.address !== undefined) updateData.address = data.address;
        if (data.founded_year !== undefined) updateData.foundedYear = data.founded_year;

        const existing = await prisma.companyInformation.findFirst();

        if (existing) {
            await prisma.companyInformation.update({
                where: { id: existing.id },
                data: updateData,
            });
        } else {
            // Create new record with all required fields
            await prisma.companyInformation.create({
                data: {
                    name: data.name || '',
                    vatNumber: data.vat_number || '',
                    primaryPhone: data.primary_phone || '',
                    alternativePhone: data.alternative_phone,
                    email: data.email || '',
                    website: data.website,
                    address: data.address || '',
                    foundedYear: data.founded_year,
                },
            });
        }

        return await this.getSettingsByCategory('company');
    }

    async updateBankingDetails(data) {
        const updateData = {};

        if (data.bank_name !== undefined) updateData.bankName = data.bank_name;
        if (data.account_holder !== undefined) updateData.accountHolder = data.account_holder;
        if (data.sort_code !== undefined) updateData.sortCode = data.sort_code;
        if (data.account_number !== undefined) updateData.accountNumber = data.account_number;
        if (data.payment_terms !== undefined) updateData.paymentTerms = data.payment_terms;


        const existing = await prisma.bankingDetails.findFirst();

        if (existing) {
            await prisma.bankingDetails.update({
                where: { id: existing.id },
                data: updateData,
            });
        } else {

            await prisma.bankingDetails.create({
                data: {
                    bankName: data.bank_name || '',
                    accountHolder: data.account_holder || '',
                    sortCode: data.sort_code || '',
                    accountNumber: data.account_number || '',
                    paymentTerms: data.payment_terms || '',
                },
            });
        }

        return await this.getSettingsByCategory('banking');
    }


    async updateSystemConfig(data) {
        const updateData = {};

        if (data.invoice_generation_day !== undefined) updateData.invoiceGenerationDay = data.invoice_generation_day;
        if (data.invoice_generation_time !== undefined) updateData.invoiceGenerationTime = data.invoice_generation_time;
        if (data.session_timeout !== undefined) updateData.sessionTimeout = parseInt(data.session_timeout);
        if (data.auto_invoicing !== undefined) updateData.autoInvoicing = data.auto_invoicing === 'true' || data.auto_invoicing === true;
        if (data.email_notifications !== undefined) updateData.emailNotifications = data.email_notifications === 'true' || data.email_notifications === true;
        if (data.sms_notifications !== undefined) updateData.smsNotifications = data.sms_notifications === 'true' || data.sms_notifications === true;
        if (data.maps_api_enabled !== undefined) updateData.mapsApiEnabled = data.maps_api_enabled === 'true' || data.maps_api_enabled === true;

        const existing = await prisma.systemConfiguration.findFirst();

        if (existing) {
            await prisma.systemConfiguration.update({
                where: { id: existing.id },
                data: updateData,
            });
        } else {
            // Create new record with defaults
            await prisma.systemConfiguration.create({
                data: updateData,
            });
        }

        return await this.getSettingsByCategory('system');
    }

    async getSystemStatus() {
        const system = await prisma.systemConfiguration.findFirst();

        return {
            systemStatus: 'Active',
            emailConfig: system?.emailNotifications ? 'Enabled' : 'Disabled',
            mapsApi: system?.mapsApiEnabled ? 'Active' : 'Inactive',
            autoInvoicing: system?.autoInvoicing ? 'On' : 'Off',
        };
    }

    async getInvoiceGenerationConfig() {
        const system = await prisma.systemConfiguration.findFirst();

        return {
            day: system?.invoiceGenerationDay || 'Sunday',
            time: system?.invoiceGenerationTime || '12:00 AM',
        };
    }

    async getSetting(key) {
        const setting = await prisma.systemSetting.findUnique({
            where: { key: key.toUpperCase() },
        });

        return setting ? setting.value : null;
    }

    async setSetting(key, value, description = null) {
        return await prisma.systemSetting.upsert({
            where: { key: key.toUpperCase() },
            update: {
                value: value.toString(),
                ...(description && { description })
            },
            create: {
                key: key.toUpperCase(),
                value: value.toString(),
                description,
            },
        });
    }
}

module.exports = new SettingsService();
