"use client";
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { createClient } from '../../../utils/supabase/client';
// Define a type for your user data
interface User {
  id: string;
  name: string;
  email: string;
}

interface DashboardState {
  users: User[];
  isLoading: boolean;
  error: string | null;
}

export default function Dashboard() {
  const [state, setState] = useState<DashboardState>({
    users: [],
    isLoading: true,
    error: null,
  });
const supabase = createClient()
  useEffect(() => {
    const fetchData = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        
        const { data: { session } } = await supabase.auth.getSession();

        console.log("token",session?.access_token )
        console.log("user",session?.user )

        const response = await fetch('http://localhost:3000/users',{
          headers:{
            'Authorization': `Bearer ${session?.access_token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const users = await response.json();
        
        setState({
          users,
          isLoading: false,
          error: null,
        });
        
      } catch (err) {
        console.error('Fetch error:', err);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : 'An error occurred',
        }));
      }
    };

    fetchData();
  }, []);

  const { users, isLoading, error } = state;

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium">Error loading data</h3>
          <p className="text-red-600 mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {users.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-gray-900">{user.name}</h3>
              <p className="text-gray-600 text-sm mt-1">{user.email}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No users found.</p>
        </div>
      )}
    </div>
  );
}