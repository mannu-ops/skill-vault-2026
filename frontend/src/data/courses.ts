export const PRODUCT_CATEGORIES = [
  'All Products',
  'Course',
  'Software',
  'Architecture & Design',
  'Game',
  'Notes',
  'Hacks',
  'Blog'
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];

export interface CourseModule {
  number: string;
  title: string;
  detail: string;
  lessons: string;
}

export interface CourseProject {
  title: string;
  description: string;
  tags: string[];
}

export interface CourseTestimonial {
  name: string;
  comment: string;
}

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  badge?: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Beginner to Advanced' | 'Intermediate to Advanced' | 'Beginner to Intermediate';
  price: string;
  originalPrice: string;
  duration: string;
  modulesCount: number;
  iconName: string;
  themeColor: 'violet' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'indigo';
  skills: string[];
  modules: CourseModule[];
  projects: CourseProject[];
  faqs: Array<[string, string]>;
  bonus?: string;
  installationProcess?: string;
  galleryImages?: string[];
  testimonials?: CourseTestimonial[];
  imageUrl?: string;
  isPublished?: boolean;
  rating?: number;
  students?: string;
}

// 100% Database Driven - Local static courses array cleared
export const COURSES: Course[] = [];
