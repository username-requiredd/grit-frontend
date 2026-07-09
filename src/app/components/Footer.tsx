import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-dark-bg border-t border-gray-200 dark:border-dark-border transition-colors duration-200">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">

          {/* Footer Navigation Links */}
          <div className="flex justify-center space-x-6 md:order-2">
            {[
              { label: 'Boards',          href: '/board'    },
              { label: 'Profile',         href: '/profile'  },
              { label: 'Privacy Policy',  href: '/privacy'  },
              { label: 'Terms of Service',href: '/terms'    },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-sm text-gray-500 dark:text-dark-secondary hover:text-gray-900 dark:hover:text-dark-primary transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Copyright */}
          <div className="mt-8 md:mt-0 md:order-1">
            <p className="text-center text-sm text-gray-500 dark:text-dark-secondary">
              &copy; {currentYear} Grit. All rights reserved.
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
}