'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight, Code, Database, Zap } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background gradient */}
      <div className="from-primary/5 via-background to-background absolute inset-0 bg-gradient-to-br" />

      <div className="container relative">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium">
              <Zap className="mr-2 h-4 w-4" />
              Production-ready monorepo
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Modern Full-Stack
              <span className="gradient-text"> Development</span>
            </h1>

            <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
              A production-grade monorepo with Next.js frontend and NestJS
              backend. Built with TypeScript, Prisma, TailwindCSS, and modern
              best practices.
            </p>

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="group">
                <Link href="/auth/sign-up">
                  <>
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/dashboard">View Dashboard</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-16"
          >
            <div className="relative mx-auto max-w-3xl">
              <div className="from-primary/20 absolute inset-0 bg-gradient-to-r to-emerald-500/20 blur-3xl" />
              <div className="bg-background/50 relative rounded-lg border p-8 backdrop-blur">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                      <Code className="text-primary h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">TypeScript</p>
                      <p className="text-muted-foreground text-sm">Type-safe</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                      <Database className="text-primary h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Prisma ORM</p>
                      <p className="text-muted-foreground text-sm">Database</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                      <Zap className="text-primary h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Turborepo</p>
                      <p className="text-muted-foreground text-sm">Monorepo</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
