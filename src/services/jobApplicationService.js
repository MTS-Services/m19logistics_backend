const prisma = require('../config/database');
const config = require('../config');

class JobApplicationService {

    async createJobApplication(applicationData, cvFilename) {
        const { fullName, email, phoneNumber, positionOfInterest, coverLetter } = applicationData;

        const cvUrl = `${config.backendUrl}/uploads/cvs/${cvFilename}`;

        return prisma.jobApplication.create({
            data: {
                fullName,
                email,
                phoneNumber,
                positionOfInterest,
                coverLetter,
                cvUrl,
                status: 'PENDING',
                isRead: false,
            },
        });
    }


    async getAllJobApplications(filters = {}) {
        const { status, positionOfInterest, isRead, startDate, endDate, limit = 100 } = filters;

        const where = {};

        if (status) {
            where.status = status;
        }

        if (positionOfInterest) {
            // Case-insensitive search for position
            where.positionOfInterest = {
                contains: positionOfInterest,
                mode: 'insensitive'
            };
        }

        if (isRead !== undefined) {
            where.isRead = isRead === 'true';
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        return prisma.jobApplication.findMany({
            where,
            orderBy: {
                createdAt: 'desc',
            },
            take: parseInt(limit),
        });
    }

    async getJobApplicationById(id) {
        const application = await prisma.jobApplication.findUnique({
            where: { id: parseInt(id) },
        });

        if (!application) {
            throw new Error('Job application not found');
        }

        return application;
    }

    async markAsRead(id) {
        return prisma.jobApplication.update({
            where: { id: parseInt(id) },
            data: { isRead: true },
        });
    }


    async updateJobApplicationStatus(id, statusData) {
        const { status, adminNotes } = statusData;

        const updateData = {};

        if (status) {
            updateData.status = status;
        }

        if (adminNotes !== undefined) {
            updateData.adminNotes = adminNotes;
        }

        return prisma.jobApplication.update({
            where: { id: parseInt(id) },
            data: updateData,
        });
    }

    async deleteJobApplication(id) {
        return prisma.jobApplication.delete({
            where: { id: parseInt(id) },
        });
    }

    async getJobApplicationStats() {

        const total = await prisma.jobApplication.count();
        const pending = await prisma.jobApplication.count({ where: { status: 'PENDING' } });
        const reviewed = await prisma.jobApplication.count({ where: { status: 'REVIEWED' } });
        const shortlisted = await prisma.jobApplication.count({ where: { status: 'SHORTLISTED' } });
        const rejected = await prisma.jobApplication.count({ where: { status: 'REJECTED' } });
        const unread = await prisma.jobApplication.count({ where: { isRead: false } });


        const pendingApplications = await prisma.jobApplication.findMany({
            where: { status: 'PENDING' },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
                positionOfInterest: true,
                cvUrl: true,
                isRead: true,
                createdAt: true,
            }
        });

        const reviewedApplications = await prisma.jobApplication.findMany({
            where: { status: 'REVIEWED' },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
                positionOfInterest: true,
                cvUrl: true,
                isRead: true,
                createdAt: true,
            }
        });

        const shortlistedApplications = await prisma.jobApplication.findMany({
            where: { status: 'SHORTLISTED' },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
                positionOfInterest: true,
                cvUrl: true,
                isRead: true,
                adminNotes: true,
                createdAt: true,
            }
        });

        const rejectedApplications = await prisma.jobApplication.findMany({
            where: { status: 'REJECTED' },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
                positionOfInterest: true,
                cvUrl: true,
                isRead: true,
                adminNotes: true,
                createdAt: true,
            }
        });

        const byPosition = await prisma.jobApplication.groupBy({
            by: ['positionOfInterest'],
            _count: {
                id: true,
            },
        });

        const positionDetails = await Promise.all(
            byPosition.map(async (p) => {
                const applications = await prisma.jobApplication.findMany({
                    where: { positionOfInterest: p.positionOfInterest },
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        phoneNumber: true,
                        positionOfInterest: true,
                        cvUrl: true,
                        status: true,
                        isRead: true,
                        createdAt: true,
                    }
                });

                return {
                    position: p.positionOfInterest,
                    count: p._count.id,
                    applications: applications
                };
            })
        );

        return {
            total,
            byStatus: {
                pending: {
                    count: pending,
                    applications: pendingApplications
                },
                reviewed: {
                    count: reviewed,
                    applications: reviewedApplications
                },
                shortlisted: {
                    count: shortlisted,
                    applications: shortlistedApplications
                },
                rejected: {
                    count: rejected,
                    applications: rejectedApplications
                }
            },
            unread: unread,
            byPosition: positionDetails,
        };
    }
}

module.exports = new JobApplicationService();
