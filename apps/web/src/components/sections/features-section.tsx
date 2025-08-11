'use client';

import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Shield,
  Smartphone,
  Zap,
  Database,
  Code,
  Users,
  Lock,
  Palette,
  Globe,
} from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Enterprise Security',
    description:
      'JWT authentication, 2FA, role-based access control, and comprehensive security headers.',
  },
  {
    icon: Smartphone,
    title: 'Responsive Design',
    description:
      'Mobile-first design with TailwindCSS and shadcn/ui components for perfect user experience.',
  },
  {
    icon: Zap,
    title: 'High Performance',
    description:
      'Optimized builds, code splitting, lazy loading, and caching for lightning-fast performance.',
  },
  {
    icon: Database,
    title: 'Modern Database',
    description:
      'Prisma ORM with PostgreSQL, type-safe queries, migrations, and database seeding.',
  },
  {
    icon: Code,
    title: 'Developer Experience',
    description:
      'TypeScript, ESLint, Prettier, Husky, and comprehensive testing setup out of the box.',
  },
  {
    icon: Users,
    title: 'User Management',
    description:
      'Complete user system with profiles, sessions, OAuth integration, and admin controls.',
  },
  {
    icon: Lock,
    title: 'Data Protection',
    description:
      'GDPR compliant, encrypted data storage, secure sessions, and privacy controls.',
  },
  {
    icon: Palette,
    title: 'Modern UI/UX',
    description:
      'Beautiful dark/light themes, smooth animations with Framer Motion, and accessibility.',
  },
  {
    icon: Globe,
    title: 'Production Ready',
    description:
      'Docker support, CI/CD pipelines, monitoring, logging, and deployment configurations.',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 md:py-32">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to build
              <span className="gradient-text"> modern applications</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              A comprehensive toolkit with all the features and best practices
              you need for production-ready applications.
            </p>
          </motion.div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
