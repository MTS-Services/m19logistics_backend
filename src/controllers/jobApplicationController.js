const jobApplicationService = require("../services/jobApplicationService");
const { body, validationResult } = require("express-validator");

/**
 * Submit a job application (Public - no authentication required)
 */
exports.submitJobApplication = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "CV file is required",
      });
    }

    const { fullName, email, phoneNumber, positionOfInterest, coverLetter } =
      req.body;

    const application = await jobApplicationService.createJobApplication(
      { fullName, email, phoneNumber, positionOfInterest, coverLetter },
      req.file.filename,
    );

    res.status(201).json({
      success: true,
      message:
        "Job application submitted successfully! We will review your application and get back to you soon.",
      data: {
        id: application.id,
        fullName: application.fullName,
        email: application.email,
        positionOfInterest: application.positionOfInterest,
        createdAt: application.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllJobApplications = async (req, res, next) => {
  try {
    const applications = await jobApplicationService.getAllJobApplications(
      req.query,
    );

    res.json({
      success: true,
      message: "Job applications retrieved successfully",
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

exports.getJobApplicationById = async (req, res, next) => {
  try {
    const application = await jobApplicationService.getJobApplicationById(
      req.params.id,
    );

    if (!application.isRead) {
      await jobApplicationService.markAsRead(req.params.id);
      application.isRead = true;
    }

    res.json({
      success: true,
      message: "Job application retrieved successfully",
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateJobApplicationStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { status, adminNotes } = req.body;

    const application = await jobApplicationService.updateJobApplicationStatus(
      req.params.id,
      { status, adminNotes },
    );

    res.json({
      success: true,
      message: "Job application status updated successfully",
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteJobApplication = async (req, res, next) => {
  try {
    await jobApplicationService.deleteJobApplication(req.params.id);

    res.json({
      success: true,
      message: "Job application deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.getJobApplicationStats = async (req, res, next) => {
  try {
    const stats = await jobApplicationService.getJobApplicationStats();

    res.json({
      success: true,
      message: "Job application statistics retrieved successfully",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

exports.markAllJobApplicationsAsRead = async (req, res, next) => {
  try {
    const result = await jobApplicationService.markAllAsRead();

    res.json({
      success: true,
      message: "All job applications marked as read",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
