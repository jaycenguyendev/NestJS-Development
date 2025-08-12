'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight, Code, Database, Zap } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />

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

            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              A production-grade monorepo with Next.js frontend and NestJS
              backend. Built with TypeScript, Prisma, TailwindCSS, and modern
              best practices.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="group">
                <Link href="/auth/sign-up">
                  <>
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
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
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-emerald-500/20 blur-3xl" />
              <div className="relative rounded-lg border bg-background/50 backdrop-blur p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Code className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">TypeScript</p>
                      <p className="text-sm text-muted-foreground">Type-safe</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Database className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Prisma ORM</p>
                      <p className="text-sm text-muted-foreground">Database</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Turborepo</p>
                      <p className="text-sm text-muted-foreground">Monorepo</p>
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
