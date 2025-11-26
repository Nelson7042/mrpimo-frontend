import Skeleton from "@/components/ui/Skeleton";
import React from "react";


const MessageListSkeleton = () => {
  const skeletons = Array.from({ length: 5 });

  return (
    <div className="space-y-3">
      {skeletons.map((_, index) => (
        <div
          key={index}
          className={`flex ${index % 2 === 0 ? "justify-start" : "justify-end"}`}
        >
          <Skeleton
            className={`h-16 w-3/4 max-w-[80%] rounded-2xl ${
              index % 2 === 0
                ? "bg-gray-300 rounded-tl-none"
                : "bg-blue-300 rounded-tr-none"
            }`}
          />
        </div>
      ))}
    </div>
  );
};

export default MessageListSkeleton;