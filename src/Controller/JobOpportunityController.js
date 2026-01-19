import Job from "../Model/Jobs.js";
import { publishJobEvent } from "../SQSClient/queuePublisher.js";

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
      jobId: savedJob._id
    });
    res.status(201).json({ message: "Job created successfully", data: newJob, status: 201 });
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
    res
      .status(200)
      .json({
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
