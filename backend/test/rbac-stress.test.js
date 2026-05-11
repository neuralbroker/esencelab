const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const bcrypt = require("bcryptjs");

process.env.NODE_ENV = "test";
process.env.SKIP_BACKEND_AUTOSTART = "1";
process.env.DATA_PROVIDER = "supabase";
process.env.SUPABASE_MOCK = "1";
process.env.JWT_SECRET = "test-jwt-secret-with-more-than-thirty-two-characters";
process.env.FRONTEND_URLS = "http://localhost:3000";
process.env.AUTH_RATE_LIMIT_MAX_REQUESTS = "120";
process.env.RECRUITER_REQUEST_RATE_LIMIT_PER_HOUR = "120";

if (process.env.DEBUG_TEST_LOGS !== "1") {
  console.log = () => undefined;
  console.warn = () => undefined;
}

const { app, __test } = require("../dist/index.js");

const ARRAY_TABLES = [
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
];

const resetDb = () => {
  for (const key of ARRAY_TABLES) {
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

test("recruiter onboarding flow handles concurrent request, approval, login, and job creation load", async () => {
  resetDb();
  const adminPassword = "AdminPassword123!";
  __test.db.profiles.push({
    id: "admin-stress-user",
    email: "stress-admin@example.com",
    passwordHash: await bcrypt.hash(adminPassword, 10),
    name: "Stress Admin",
    role: "admin",
    avatarUrl: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
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
    const adminLogin = await request("POST", "/auth/login", {
      email: "stress-admin@example.com",
      password: adminPassword,
    });
    assert.equal(adminLogin.response.status, 200);
    const adminToken = adminLogin.payload.token;

    const totalRequests = 40;
    const requestResults = await Promise.all(
      Array.from({ length: totalRequests }, (_, index) =>
        request("POST", "/recruiter-requests", {
          name: `Stress Recruiter ${index}`,
          email: `stress-recruiter-${index}@example.com`,
          companyName: `Stress Company ${index}`,
          companyWebsite: `stress-${index}.example.com`,
          jobTitle: "Talent Partner",
          message: "Concurrent onboarding validation for launch readiness.",
        }),
      ),
    );

    for (const result of requestResults) {
      assert.equal(result.response.status, 201);
      assert.equal(result.payload.data.status, "pending");
    }

    const pending = await request(
      "GET",
      "/admin/recruiter-requests?status=pending&limit=100",
      undefined,
      adminToken,
    );
    assert.equal(pending.response.status, 200);
    assert.equal(pending.payload.summary.pending, totalRequests);

    const approvalsToRun = pending.payload.data.slice(0, 20);
    const approvalResults = await Promise.all(
      approvalsToRun.map((entry, index) =>
        request(
          "PATCH",
          `/admin/recruiter-requests/${entry.id}`,
          {
            status: "approved",
            adminNotes: "Stress test approval.",
            temporaryPassword: `StressRecruiterPass${index}!`,
          },
          adminToken,
        ),
      ),
    );

    for (const result of approvalResults) {
      assert.equal(result.response.status, 200);
      assert.equal(result.payload.data.status, "approved");
    }

    const recruiterLogins = await Promise.all(
      approvalsToRun.map((entry, index) =>
        request("POST", "/auth/login", {
          email: entry.email,
          password: `StressRecruiterPass${index}!`,
        }),
      ),
    );

    for (const result of recruiterLogins) {
      assert.equal(result.response.status, 200);
      assert.equal(result.payload.user.canonicalRole, "recruiter");
    }

    const jobResults = await Promise.all(
      recruiterLogins.map((loginResult, index) =>
        request(
          "POST",
          "/jobs",
          {
            title: `Stress Job ${index}`,
            company: `Stress Company ${index}`,
            location: "Remote",
            description: "Concurrent recruiter job creation validation.",
            requirements: ["React", "TypeScript", "Communication"],
            skills: ["React", "TypeScript", "Communication"],
            jobType: "internship",
            experienceLevel: "entry",
          },
          loginResult.payload.token,
        ),
      ),
    );

    for (const result of jobResults) {
      assert.equal(result.response.status, 201);
      assert.equal(result.payload.data.status, "active");
    }

    const allRequests = await request(
      "GET",
      "/admin/recruiter-requests?status=all&limit=100",
      undefined,
      adminToken,
    );
    assert.equal(allRequests.response.status, 200);
    assert.equal(allRequests.payload.summary.total, totalRequests);
    assert.equal(allRequests.payload.summary.approved, approvalsToRun.length);
    assert.equal(
      allRequests.payload.summary.pending,
      totalRequests - approvalsToRun.length,
    );
    assert.equal(__test.db.jobs.length, jobResults.length);
  } finally {
    await close(server);
  }
});
