// app/page.tsx

// import { HeartIcon } from "@/components/HeartIcon";
// import { ChatIllustration } from "@/components/ChatIllustration";
import { HeartIcon } from "./HeartIcon";
import { ChatIllustration } from "./bubble";


export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-12 bg-gray-50 p-10">
      
      <h1 className="text-2xl font-bold">SVG Showcase</h1>

      {/* Heart Icon */}
      <div className="w-40 h-40">
        <HeartIcon />
      </div>

      {/* Chat Illustration */}
      <div className="w-72 h-72">
        <ChatIllustration />
      </div>

    </main>
  );
}