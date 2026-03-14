import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

type SeedUserConfig = {
  email: string;
  password: string;
  name: string;
  role: Role;
};

const readSeedUser = (
  prefix: string,
  role: Role,
  fallbackName: string
): SeedUserConfig | null => {
  const email = String(process.env[`${prefix}_EMAIL`] || '')
    .trim()
    .toLowerCase();
  const password = String(process.env[`${prefix}_PASSWORD`] || '').trim();
  const name = String(process.env[`${prefix}_NAME`] || fallbackName).trim() || fallbackName;

  if (!email && !password) {
    return null;
  }
  if (!email || !password) {
    throw new Error(`${prefix}_EMAIL and ${prefix}_PASSWORD must both be set.`);
  }

  return {
    email,
    password,
    name,
    role,
  };
};

async function upsertUser(config: SeedUserConfig) {
  const passwordHash = await bcrypt.hash(config.password, 10);
  return prisma.user.upsert({
    where: { email: config.email },
    update: {
      name: config.name,
      role: config.role,
      passwordHash,
    },
    create: {
      email: config.email,
      passwordHash,
      name: config.name,
      role: config.role,
    },
  });
}

async function main() {
  console.log('Seeding database...');

  const adminConfig = readSeedUser('SEED_ADMIN', 'admin', 'Platform Admin');
  const recruiterConfig = readSeedUser('SEED_RECRUITER', 'recruiter', 'Initial Recruiter');
  const studentConfig = readSeedUser('SEED_STUDENT', 'student', 'Initial Student');

  const createdUsers = [];
  if (adminConfig) {
    createdUsers.push(await upsertUser(adminConfig));
  }

  let recruiter = null;
  if (recruiterConfig) {
    recruiter = await upsertUser(recruiterConfig);
    createdUsers.push(recruiter);
  }

  if (studentConfig) {
    createdUsers.push(await upsertUser(studentConfig));
  }

  if (recruiter) {
    await Promise.all([
      prisma.job.upsert({
        where: { id: 'job-1' },
        update: {},
        create: {
          id: 'job-1',
          title: 'Software Engineer',
          company: 'Tech Corp',
          description: 'We are looking for a skilled software engineer to join our team.',
          requirements: 'Python, JavaScript, React, Node.js, SQL',
          location: 'New York, NY',
          salaryMin: 80000,
          salaryMax: 120000,
          jobType: 'full_time',
          status: 'active',
          recruiterId: recruiter.id,
        },
      }),
      prisma.job.upsert({
        where: { id: 'job-2' },
        update: {},
        create: {
          id: 'job-2',
          title: 'Data Scientist',
          company: 'Data Inc',
          description: 'Join our data science team to build ML models.',
          requirements: 'Python, Machine Learning, TensorFlow, SQL, Statistics',
          location: 'San Francisco, CA',
          salaryMin: 100000,
          salaryMax: 150000,
          jobType: 'full_time',
          status: 'active',
          recruiterId: recruiter.id,
        },
      }),
      prisma.job.upsert({
        where: { id: 'job-3' },
        update: {},
        create: {
          id: 'job-3',
          title: 'Frontend Developer',
          company: 'Web Solutions',
          description: 'Build beautiful web applications.',
          requirements: 'React, TypeScript, CSS, HTML, JavaScript',
          location: 'Remote',
          salaryMin: 60000,
          salaryMax: 90000,
          jobType: 'full_time',
          status: 'active',
          recruiterId: recruiter.id,
        },
      }),
    ]);
  } else {
    console.log('Skipping job seed because SEED_RECRUITER credentials were not provided.');
  }

  await Promise.all([
    prisma.course.upsert({
      where: { id: 'course-1' },
      update: {},
      create: {
        id: 'course-1',
        title: 'Complete Python Bootcamp',
        description: 'Learn Python from scratch to advanced concepts.',
        instructor: 'Dr. Angela Yu',
        url: 'https://example.com/courses/python',
      },
    }),
    prisma.course.upsert({
      where: { id: 'course-2' },
      update: {},
      create: {
        id: 'course-2',
        title: 'React - The Complete Guide',
        description: 'Master React.js including hooks, Redux, and more.',
        instructor: 'Maximilian Schwarzmuller',
        url: 'https://example.com/courses/react',
      },
    }),
  ]);

  if (createdUsers.length === 0) {
    console.log('No seed users were created. Set SEED_ADMIN_* and/or SEED_RECRUITER_* if needed.');
  } else {
    console.log(`Created or updated ${createdUsers.length} seed user(s).`);
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
