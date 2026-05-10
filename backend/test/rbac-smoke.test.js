const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const bcrypt = require("bcryptjs");

process.env.NODE_ENV = "test";
process.env.SKIP_BACKEND_AUTOSTART = "1";
process.env.DATA_PROVIDER = "supabase";
process.env.SUPABASE_MOCK = "1";
process.env.JWT_SECRET =
  "test-jwt-secret-with-more-than-thirty-two-characters";
process.env.FRONTEND_URLS = "http://localhost:3000";

const { app, __test } = require("../dist/index.js");

const resetDb = () => {
  for (const key of [
    "profiles",
    "jobs",
    "candidates",
    "applications",
    "courses",
    "resumes",
    "recommendations",
    "resumeScores",
    "skillProgress",
    "learningPlans",
    "mockInterviewSessions",
    "savedJobs",
    "careerPreferences",
    "recruiterAccessRequests",
    "adminLogs",
  ]) {
    __test.db[key] = [];
  }
  __test.db.requestMetrics = {
    totalRequests: 0,
    totalErrors: 0,
    authFailures: 0,
    slowRequests: 0,
    endpoints: {},
  };
};

const listen = (server) =>
  new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

const close = (server) =>
  new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

test("student auth and recruiter admin approval flow", async () => {
  resetDb();
  const now = new Date();
  const adminPassword = "AdminPassword123!";
  __test.db.profiles.push({
    id: "admin-test-user",
    email: "admin@example.com",
    passwordHash: await bcrypt.hash(adminPassword, 10),
    name: "Admin User",
    role: "admin",
    avatarUrl: null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  const server = http.createServer(app);
  await listen(server);
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  const request = async (method, path, body, token) => {
    const headers = {};
    if (body !== undefined) headers["content-type"] = "application/json";
    if (token) headers.authorization = `Bearer ${token}`;
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const payload = await response.json();
    return { response, payload };
  };

  try {
    const studentRegister = await request("POST", "/auth/register", {
      name: "Student One",
      email: "student@example.com",
      password: "student123",
      role: "student",
    });
    assert.equal(studentRegister.response.status, 201);
    assert.equal(studentRegister.payload.user.role, "student");
    assert.equal(studentRegister.payload.user.canonicalRole, "student");
    const studentToken = studentRegister.payload.token;

    const blockedRecruiterRegister = await request("POST", "/auth/register", {
      name: "Recruiter Direct",
      email: "direct-recruiter@example.com",
      password: "recruiter123",
      role: "recruiter",
    });
    assert.equal(blockedRecruiterRegister.response.status, 403);
    assert.match(
      blockedRecruiterRegister.payload.message,
      /Recruiters must request admin approval/i,
    );

    const recruiterRequest = await request("POST", "/recruiter-requests", {
      name: "Rita Recruiter",
      email: "rita@example.com",
      companyName: "Rita Labs",
      companyWebsite: "rita.example.com",
      jobTitle: "Talent Lead",
      message: "We want to post internships and review shortlisted students.",
    });
    assert.equal(recruiterRequest.response.status, 201);
    assert.equal(recruiterRequest.payload.data.status, "pending");
    assert.equal(recruiterRequest.payload.data.email, "rita@example.com");

    const duplicateRecruiterRequest = await request(
      "POST",
      "/recruiter-requests",
      {
        name: "Rita Recruiter",
        email: "rita@example.com",
        companyName: "Rita Labs",
        message: "Duplicate pending request.",
      },
    );
    assert.equal(duplicateRecruiterRequest.response.status, 409);

    const adminLogin = await request("POST", "/auth/login", {
      email: "admin@example.com",
      password: adminPassword,
    });
    assert.equal(adminLogin.response.status, 200);
    assert.equal(adminLogin.payload.user.canonicalRole, "admin");
    const adminToken = adminLogin.payload.token;

    const pendingRequests = await request(
      "GET",
      "/admin/recruiter-requests?status=pending",
      undefined,
      adminToken,
    );
    assert.equal(pendingRequests.response.status, 200);
    assert.equal(pendingRequests.payload.summary.pending, 1);
    assert.equal(pendingRequests.payload.data[0].email, "rita@example.com");

    const temporaryPassword = "RecruiterPass123!";
    const approveRequest = await request(
      "PATCH",
      `/admin/recruiter-requests/${recruiterRequest.payload.data.id}`,
      {
        status: "approved",
        adminNotes: "Verified company and hiring use case.",
        temporaryPassword,
      },
      adminToken,
    );
    assert.equal(approveRequest.response.status, 200);
    assert.equal(approveRequest.payload.data.status, "approved");
    assert.equal(approveRequest.payload.temporaryPassword, temporaryPassword);

    const recruiterLogin = await request("POST", "/auth/login", {
      email: "rita@example.com",
      password: temporaryPassword,
    });
    assert.equal(recruiterLogin.response.status, 200);
    assert.equal(recruiterLogin.payload.user.role, "employer");
    assert.equal(recruiterLogin.payload.user.canonicalRole, "recruiter");
    const recruiterToken = recruiterLogin.payload.token;

    const blockedStudentJob = await request(
      "POST",
      "/jobs",
      {
        title: "Frontend Intern",
        company: "Rita Labs",
        location: "Remote",
        description: "Internship role",
        requirements: ["React", "TypeScript"],
        skills: ["React", "TypeScript"],
      },
      studentToken,
    );
    assert.equal(blockedStudentJob.response.status, 403);

    const recruiterJob = await request(
      "POST",
      "/jobs",
      {
        title: "Frontend Intern",
        company: "Rita Labs",
        location: "Remote",
        description: "Internship role",
        requirements: ["React", "TypeScript"],
        skills: ["React", "TypeScript"],
        jobType: "internship",
        experienceLevel: "entry",
      },
      recruiterToken,
    );
    assert.equal(recruiterJob.response.status, 201);
    assert.equal(recruiterJob.payload.data.employerId, recruiterLogin.payload.user.id);
  } finally {
    await close(server);
  }
});
