'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Github } from 'lucide-react';

export function CTASection() {
  return (
    <section className="py-20 md:py-32">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mx-auto max-w-4xl"
        >
          <div className="from-primary relative overflow-hidden rounded-3xl bg-gradient-to-r to-emerald-600 px-8 py-16 md:px-16">
            <div className="bg-grid-white/10 absolute inset-0" />
            <div className="relative text-center text-white">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to start building?
              </h2>
              <p className="text-primary-foreground/90 mx-auto mt-4 max-w-2xl text-lg">
                Join thousands of developers who are already building amazing
                applications with our production-ready monorepo template.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                <Button asChild size="lg" variant="secondary" className="group">
                  <Link href="/auth/sign-up">
                    <>
                      Get Started Free
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Link
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <>
                      <Github className="mr-2 h-4 w-4" />
                      View on GitHub
                    </>
                  </Link>
                </Button>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-6 text-center sm:grid-cols-3">
                <div>
                  <div className="text-2xl font-bold">100%</div>
                  <div className="text-primary-foreground/80 text-sm">
                    Open Source
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold">TypeScript</div>
                  <div className="text-primary-foreground/80 text-sm">
                    Type Safe
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold">Production</div>
                  <div className="text-primary-foreground/80 text-sm">
                    Ready
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
