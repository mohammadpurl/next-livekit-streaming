'use client';

import dynamic from 'next/dynamic';

// Dynamically import the AvatarChat component with no SSR
const AvatarChat = dynamic(() => import('./components/AvatarChat'), {
  ssr: false,
});

export default function Home() {
  return (
    <div className="flex flex-1  flex flex-col">
      <div className="w-[900px] flex flex-col items-start justify-start gap-5 mx-auto pt-4 pb-20">
        <div className="w-full">
          <AvatarChat />
        </div>
      </div>
    </div>
    // <main className="flex flex-1 min-h-screen p-4">
    //   {/* <h1 className="text-3xl font-bold text-center mb-8">AI Avatar Chat</h1> */}
    //   <AvatarChat />
    // </main>
  );
}
