"use client"
import { ArrowRight, Github, Zap, Users, FileText, Check } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from './components/ThemeToggle';


const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg transition-colors duration-200">
      {/* Navbar */}
      <nav className="border-b border-gray-200 dark:border-dark-border bg-white/80 dark:bg-dark-surface/80 backdrop-blur-sm sticky top-0 z-50 transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-dark-primary">Grit</h1>
          <div className="flex items-center gap-4 sm:gap-6">
            <ThemeToggle />
            <a
              href="https://github.com/username-requiredd/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 dark:text-dark-secondary hover:text-gray-900 dark:hover:text-dark-primary transition flex items-center gap-2"
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
            <Link
              href={"/sign-in"}
              className="text-sm text-gray-600 dark:text-dark-secondary hover:text-gray-900 dark:hover:text-dark-primary transition"
            >
              Sign in
            </Link>
            <Link
              href={"/sign-up"}
              className="bg-black dark:bg-white text-white dark:text-black text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-6 pt-32 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-dark-elevated rounded-full text-xs text-gray-600 dark:text-dark-secondary mb-6 border border-gray-200 dark:border-dark-border transition-colors">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
          Real-time collaboration
        </div>
        <h2 className="text-5xl md:text-7xl font-semibold text-gray-900 dark:text-dark-primary leading-[1.1] mb-6 tracking-tight">
          Simple task management
          <br />
          <span className="text-gray-400 dark:text-dark-secondary">for modern teams</span>
        </h2>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Real-time collaboration with drag-and-drop kanban boards. 
          Built with Next.js, NestJS, and Supabase.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href={"/sign-up"}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white font-medium text-base px-8 py-3.5 rounded-lg hover:bg-indigo-700 transition shadow-sm hover:shadow-md"
          >
            Start for free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="https://github.com/username-requiredd"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-dark-secondary hover:text-gray-900 dark:hover:text-dark-primary font-medium text-base transition"
          >
            <Github className="w-5 h-5" />
            View on GitHub
          </a>
        </div>
      </div>

      {/* Preview Image / Placeholder */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-surface dark:to-dark-bg rounded-2xl border border-gray-200 dark:border-dark-border overflow-hidden shadow-lg transition-colors">
          <div className="p-4 sm:p-6 md:p-8">
            <div className="bg-white dark:bg-dark-bg rounded-xl border border-gray-200 dark:border-dark-border shadow-sm overflow-hidden transition-colors">
              {/* Mock Kanban Board */}
              <div className="p-6 border-b border-gray-200 dark:border-dark-border flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-dark-primary">Project Dashboard</h3>
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-dark-elevated"></div>
                  <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-dark-elevated"></div>
                  <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-dark-elevated"></div>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Column 1 */}
                <div className="space-y-3">
                  <div className="text-xs font-medium text-gray-500 dark:text-dark-secondary uppercase tracking-wider">To Do</div>
                  <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg p-3 space-y-2 shadow-sm">
                    <div className="h-2 bg-gray-200 dark:bg-dark-elevated rounded w-3/4"></div>
                    <div className="h-2 bg-gray-200 dark:bg-dark-elevated rounded w-1/2"></div>
                  </div>
                  <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg p-3 space-y-2 shadow-sm">
                    <div className="h-2 bg-gray-200 dark:bg-dark-elevated rounded w-2/3"></div>
                    <div className="h-2 bg-gray-200 dark:bg-dark-elevated rounded w-1/3"></div>
                  </div>
                </div>
                {/* Column 2 */}
                <div className="space-y-3">
                  <div className="text-xs font-medium text-gray-500 dark:text-dark-secondary uppercase tracking-wider">In Progress</div>
                  <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg p-3 space-y-2 shadow-sm">
                    <div className="h-2 bg-gray-200 dark:bg-dark-elevated rounded w-3/4"></div>
                    <div className="h-2 bg-gray-200 dark:bg-dark-elevated rounded w-1/2"></div>
                  </div>
                </div>
                {/* Column 3 */}
                <div className="space-y-3">
                  <div className="text-xs font-medium text-gray-500 dark:text-dark-secondary uppercase tracking-wider">Done</div>
                  <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg p-3 space-y-2 shadow-sm">
                    <div className="h-2 bg-gray-200 dark:bg-dark-elevated rounded w-2/3"></div>
                    <div className="h-2 bg-gray-200 dark:bg-dark-elevated rounded w-1/2"></div>
                  </div>
                  <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg p-3 space-y-2 shadow-sm">
                    <div className="h-2 bg-gray-200 dark:bg-dark-elevated rounded w-3/4"></div>
                    <div className="h-2 bg-gray-200 dark:bg-dark-elevated rounded w-1/3"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h3 className="text-3xl md:text-4xl font-semibold text-gray-900 dark:text-dark-primary mb-4">
            Everything you need
          </h3>
          <p className="text-lg text-gray-600 dark:text-dark-secondary">
            Powerful features for seamless project management
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Zap,
              title: "Real-time sync",
              desc: "Changes appear instantly across all devices. No refresh needed."
            },
            {
              icon: FileText,
              title: "File attachments",
              desc: "Drag and drop images, documents, and files directly to cards."
            },
            {
              icon: Users,
              title: "Team collaboration",
              desc: "Work together with your team in real-time with live updates."
            }
          ].map((feature) => (
            <div key={feature.title} className="group">
              <div className="bg-gray-50 dark:bg-dark-surface rounded-xl p-8 border border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-600 transition-colors h-full">
                <div className="w-12 h-12 bg-black dark:bg-indigo-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-dark-primary mb-2">{feature.title}</h4>
                <p className="text-sm text-gray-600 dark:text-dark-secondary leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="border-t border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg transition-colors">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h3 className="text-3xl md:text-4xl font-semibold text-gray-900 dark:text-dark-primary mb-6">
                Built for productivity
              </h3>
              <div className="space-y-4">
                {[
                  "Drag and drop interface",
                  "Unlimited boards and cards",
                  "Real-time notifications",
                  "Mobile responsive design",
                  "Secure file storage",
                  "Team member invitations"
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-indigo-600 dark:bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-gray-700 dark:text-dark-secondary">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Abstract UI representation */}
            <div className="bg-white dark:bg-dark-surface rounded-2xl border border-gray-200 dark:border-dark-border p-8 shadow-sm transition-colors">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-dark-elevated rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 dark:bg-dark-elevated rounded w-1/2"></div>
                    <div className="h-2 bg-gray-100 dark:bg-dark-bg rounded w-3/4"></div>
                  </div>
                </div>
                <div className="h-px bg-gray-200 dark:bg-dark-border"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-dark-elevated rounded w-full"></div>
                  <div className="h-3 bg-gray-200 dark:bg-dark-elevated rounded w-5/6"></div>
                  <div className="h-3 bg-gray-200 dark:bg-dark-elevated rounded w-4/6"></div>
                </div>
                <div className="flex gap-2 pt-2">
                  <div className="h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 dark:bg-dark-elevated rounded w-20"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="border-t border-gray-200 dark:border-dark-border transition-colors">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-dark-secondary text-center mb-8">
            Built with modern technologies
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6">
            {['Next.js 15', 'NestJS', 'Socket.io', 'Supabase', 'Tailwind CSS', 'TypeScript'].map((tech) => (
              <div key={tech} className="px-4 py-2 bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg text-sm text-gray-700 dark:text-dark-secondary hover:border-gray-300 dark:hover:border-gray-500 transition-colors">
                {tech}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="border-t border-gray-200 dark:border-dark-border transition-colors">
        <div className="max-w-3xl mx-auto px-6 py-32 text-center">
          <h3 className="text-4xl md:text-5xl font-semibold text-gray-900 dark:text-dark-primary mb-4">
            Ready to get organized?
          </h3>
          <p className="text-lg text-gray-600 dark:text-dark-secondary mb-10">
            Start managing your projects today. No credit card required.
          </p>
          <Link
            href={"/sign-up"}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white font-medium text-base px-10 py-4 rounded-lg hover:bg-indigo-700 transition shadow-sm hover:shadow-md"
          >
            Get started for free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-surface transition-colors">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-dark-primary mb-1">Grit</h4>
              <p className="text-sm text-gray-500 dark:text-dark-secondary">© 2026 All rights reserved.</p>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-8">
              <a href="#" className="text-sm text-gray-600 dark:text-dark-secondary hover:text-gray-900 dark:hover:text-dark-primary transition">
                Privacy
              </a>
              <a href="#" className="text-sm text-gray-600 dark:text-dark-secondary hover:text-gray-900 dark:hover:text-dark-primary transition">
                Terms
              </a>
              <a href="#" className="text-sm text-gray-600 dark:text-dark-secondary hover:text-gray-900 dark:hover:text-dark-primary transition">
                Docs
              </a>
              <a
                href="https://github.com/username-requiredd"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 dark:text-dark-secondary hover:text-gray-900 dark:hover:text-dark-primary transition flex items-center gap-2"
              >
                <Github className="w-4 h-4" />
                GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;