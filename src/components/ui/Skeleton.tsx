

const Skeleton = ({ className }: { className?: string }) => {
    return (
      <div
        className={`bg-gray-200 animate-shimmer rounded animate-pulse ${className}`}
      />
    );
  };
  

export default Skeleton