// models/studentData.js
import mongoose from "mongoose";

const studentDataSchema = new mongoose.Schema({
  email: { type: String },
  certificateId: { type: String, required: true },
  name: { type: String, required: true },
  internshipDomain: { type: String, required: true },
  internshipStartDate: { type: Date, required: true },
  internshipEndDate: { type: Date, required: true },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
});

export default mongoose.model("StudentData", studentDataSchema);
