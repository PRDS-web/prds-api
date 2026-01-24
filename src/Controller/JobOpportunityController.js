import jobApplication from "../Model/jobApplication.js";
import Job from "../Model/Jobs.js";
import { publishJobEvent } from "../SQSClient/queuePublisher.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    return res.status(200).json({
      message: "Jobs fetched successfully",
      title: "Jobs Fetch Status",
      status: 200,
      jobs,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching jobs",
      title: "Jobs Fetch Error",
      status: 500,
      error: error.message,
    });
  }
};

export const createNewJob = async (req, res) => {
  const {
    jobTitle,
    lastdateToApply,
    jobDescription,
    country,
    jobStatus,
    jobLocation,
    jobType,
    skillsRequired,
  } = req.body;
  if (
    !jobTitle ||
    !lastdateToApply ||
    !jobDescription ||
    !country ||
    !jobStatus ||
    !jobLocation ||
    !jobType ||
    !skillsRequired
  ) {
    return res.status(400).json({
      message: "All fields are required",
      status: 400,
    });
  }
  try {
    const newJob = new Job({
      jobTitle,
      lastdateToApply,
      jobDescription,
      country,
      jobStatus,
      jobLocation,
      jobType,
      skillsRequired,
    });
    const savedJob = await newJob.save();
    await publishJobEvent({
      eventType: "JOB_CREATED",
      jobId: savedJob._id,
    });
    res
      .status(201)
      .json({ message: "Job created successfully", data: newJob, status: 201 });
  } catch (error) {
    res.status(500).json({ message: "Error creating job", error, status: 500 });
  }
};
export const updateJob = async (req, res) => {
  const {
    _id,
    jobTitle,
    lastdateToApply,
    jobDescription,
    country,
    jobStatus,
    jobLocation,
    jobType,
    skillsRequired,
  } = req.body;
  if (!_id) {
    return res.status(400).json({
      message: "Job ID is required",
      status: 400,
    });
  }
  try {
    const updatedJob = await Job.findByIdAndUpdate(
      _id,
      {
        jobTitle,
        lastdateToApply,
        jobDescription,
        country,
        jobStatus,
        jobLocation,
        jobType,
        skillsRequired,
      },
      { new: true },
    );
    if (!updatedJob) {
      return res.status(404).json({ message: "Job not found", status: 404 });
    }
    res.status(200).json({
      message: "Job updated successfully",
      data: updatedJob,
      status: 200,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating job", error, status: 500 });
  }
};
export const deleteJob = async (req, res) => {
  const { jobId } = req.params;
  if (!jobId) {
    return res.status(400).json({
      message: "Job ID is required",
      status: 400,
    });
  }
  try {
    const deletedJob = await Job.findByIdAndDelete(jobId);
    if (!deletedJob) {
      return res.status(404).json({ message: "Job not found", status: 404 });
    }
    res.status(200).json({ message: "Job deleted successfully", status: 200 });
  } catch (error) {
    res.status(500).json({ message: "Error deleting job", error, status: 500 });
  }
};
export const applyJob = async (req, res) => {
  // Implementation for job application
  const {
    jobId,
    firstName,
    lastName,
    email,
    phoneNumber,
    experience,
    linkedIn,
    skills,
    userId,
  } = req.body;
  // const token = req.cookies.authToken;
  //  const {id, exp, iss} = jwt.verify(token, process.env.JWT_SECRET);
  // Validate required fields
  if (
    !jobId ||
    !firstName ||
    !email ||
    !phoneNumber ||
    !experience ||
    !linkedIn ||
    !skills ||
    !userId
  ) {
    return res.status(400).json({
      message: "All fields are required",
      status: 400,
    });
  }
  try {
    const isJobExist = await Job.findById(jobId);
    if (!isJobExist) {
      return res.status(404).json({
        message: "Job not found",
        status: 404,
      });
    }
    if (isJobExist.jobStatus !== "Active") {
      return res.status(400).json({
        message: "Cannot apply to inactive job",
        status: 400,
      });
    }
    if (new Date(isJobExist.lastdateToApply) < new Date()) {
      return res.status(400).json({
        message: "Application deadline has passed",
        status: 400,
      });
    }
    if (isJobExist.appliedCandidates.includes(userId)) {
      return res.status(400).json({
        message: "User has already applied to this job",
        status: 400,
      });
    }
    console.log("Applying to job:", jobId, "by user:", userId);
    const newApplication = new jobApplication({
      firstName,
      lastName,
      email,
      phoneNumber,
      experience,
      linkedIn,
      skills,
      userId,
      jobId,
    });
    isJobExist.appliedCandidates.push(userId);
    await isJobExist.save();
    console.log("candidate id saved in job");
    await newApplication.save();
    console.log("application saved");
    return res.status(201).json({
      message: "Job application submitted successfully",
      status: 201,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error submitting job application",
      status: 500,
      error: error.message,
    });
  }
};
export const appliedJob = async (req, res) => {
  const userId = req.userId;
  try {
    const applications = await jobApplication.aggregate([
      { $match: { userId } },
      { $sort: { createdAt: -1 } },

      {
        $addFields: {
          jobObjectId: { $toObjectId: "$jobId" },
        },
      },

      {
        $lookup: {
          from: "jobs",
          localField: "jobObjectId",
          foreignField: "_id",
          as: "jobDetails",
        },
      },

      {
        $unwind: {
          path: "$jobDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    return res.status(200).json({
      message: "Applied jobs fetched successfully",
      title: "Applied Jobs Fetch Status",
      status: 200,
      applications,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching applied jobs",
      title: "Applied Jobs Fetch Error",
      status: 500,
      error: error.message,
    });
  }
};
