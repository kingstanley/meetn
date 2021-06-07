const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  username: String,
  starttime: { type: Date, default: Date.now() },
  leftTime: Date,
});

const lectureSchema = new mongoose.Schema({
  courseCode: String,
  courseId: String,
  facultyId: Number,
  departmentId: Number,
  levelId: Number,
  courseTitle: String,
  startTime: Date,
  endTime: Date,
  lecturerUIN: String,
  documents: [{}],
  location: String,
  inviteId: String,
  platform: String,
  sessionId: Number,
  semesterId: Number,
  createdAt: { type: Date, default: Date.now() },
  attendance: [
    {
      username: String,
      UIN: String,
      starttime: { type: Date, default: Date.now() },
      leftTime: { type: Date, default: Date.now() },
    },
  ],
  lecturers: [{}],
  hall: String,
  comments: [
    {
      comment: String,
      userId: String,
      UIN: String,
      username: String,
      commentDate: { type: Date, default: new Date() },
    },
  ],
});

const Lecture = mongoose.model("lecture", lectureSchema);
module.exports = Lecture;
