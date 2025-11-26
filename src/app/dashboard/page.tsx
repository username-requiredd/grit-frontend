import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function Dashboard() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Handle error if cookies can't be set
          }
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/sign-in');
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">
        Welcome, {session.user.email}
      </h1>
      <p>Your Kanban boards will appear here soon.</p>
    </div>
  );
}