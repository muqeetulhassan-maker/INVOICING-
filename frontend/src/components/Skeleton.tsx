export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-surface-raised
        motion-reduce:animate-none ${className}`}
    />
  );
}

export default Skeleton;

