import React from "react";

const Loader = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
      <div className="flex flex-col items-center space-y-6 animate-fade-in">
        {/* Spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-[#5187f6] border-t-transparent animate-spin" />
          <div className="absolute inset-2 rounded-full bg-[#5187f6] opacity-20 blur" />
        </div>

        {/* Brand or App Name */}
        <h1 className="text-[#5187f6] text-xl font-semibold tracking-wide">
          Mprimo is loading...
        </h1>

        {/* Subtle Progress Line */}
        <div className="w-40 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-[#5187f6] animate-loading-bar rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default Loader;
