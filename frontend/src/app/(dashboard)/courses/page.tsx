'use client';

/**
 * Courses page.
 *
 * This page lists learning resources and recommended courses that support the
 * student skill-gap and roadmap workflows.
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Course } from '@/types';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import { GraduationCap, ExternalLink, User, Star, BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/Skeleton';
import { motion } from 'framer-motion';

export default function CoursesPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCourses();
    }
  }, [isAuthenticated]);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/courses');
      setCourses(res.data.data || []);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="layout-container section-spacing space-y-8 max-w-6xl mx-auto">
        <Skeleton className="h-16 w-1/3 mb-10" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="layout-container section-spacing space-y-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary mb-2">Learning Courses</h1>
          <p className="text-base text-secondary">Upskill with curated courses to bridge your skill gaps.</p>
        </div>
      </div>

      {courses.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
          }}
        >
          {courses.map((course) => (
            <motion.div key={course.id} variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}>
              <Card hoverable className="flex flex-col h-full p-6">
                <div className="h-32 bg-accent-soft rounded-2xl mb-6 flex items-center justify-center border border-border">
                  <BookOpen className="w-10 h-10 text-accent/80" />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-primary mb-2 line-clamp-2" title={course.title}>{course.title}</h3>
                  <p className="text-secondary text-sm mb-5 line-clamp-2">{course.description}</p>
                </div>

                {course.skills && course.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6 mt-auto">
                    {course.skills.slice(0, 3).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="font-normal px-2.5 py-1">
                        {skill}
                      </Badge>
                    ))}
                    {course.skills.length > 3 && (
                      <Badge variant="secondary" className="font-normal px-2.5 py-1">
                        +{course.skills.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-secondary mb-6 pt-4 border-t border-border mt-auto">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    <span className="line-clamp-1">{course.provider}</span>
                  </div>
                  <div className="flex items-center font-medium">
                    <Star className="w-4 h-4 mr-1 text-gray-600 fill-current" />
                    {course.rating || '4.5'}
                  </div>
                </div>

                <a
                  href={course.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto"
                >
                  <Button variant="primary" className="w-full justify-center">
                    <span className="mr-2">View Course</span>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <Card hoverable={false} className="text-center py-16 flex flex-col items-center">
          <div className="w-16 h-16 bg-accent-soft rounded-full flex items-center justify-center mb-6">
            <GraduationCap className="w-8 h-8 text-accent" />
          </div>
          <h3 className="text-xl font-medium text-primary mb-2">No courses available</h3>
          <p className="text-secondary">Check back later for new curated learning materials.</p>
        </Card>
      )}
    </div>
  );
}

