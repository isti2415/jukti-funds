import Link from 'next/link';
import React from 'react';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-900 ">
      {/* Header or navigation section */}
      <header className="bg-gray-900 p-9 mb-12 position: fixed; top: 0; z-index: 100;">
        <Link href="">
            <div className="mr-2 fixed transform flex items-center">
              <img src="/jukti.webp" alt="JUKTI" className="h-12" />
              <h1 className="text-lg text-gray-400 ml-2"> - Official Club of CSE</h1>
            </div>
        </Link>
      </header>


      {/* Page content */}
      <main className="container mx-auto">
        {children}
      </main>

      {/* Footer or other sections */}
      <footer className="bg-gray-900 p-8 position: fixed; top: 0; bottom: 0; width: 100%;">
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="flex justify-center space-x-24">
            <img src="/jukti.webp" alt="JUKTI" className="h-12" />
            <img src="/cse.webp" alt="CSE" className="h-12" />
            <img src="/iub.webp" alt="IUB" className="h-12" />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
