'use client';

import dynamic from 'next/dynamic';

// Dynamically import the AvatarChat component with no SSR
const AvatarChat = dynamic(() => import('./components/AvatarChat'), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="min-h-screen p-4">
      <h1 className="text-3xl font-bold text-center mb-8">AI Avatar Chat</h1>
      <AvatarChat />
    </main>
  );
}
