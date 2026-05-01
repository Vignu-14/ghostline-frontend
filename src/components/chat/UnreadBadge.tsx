type UnreadBadgeProps = {
  count: number;
};

export function UnreadBadge({ count }: UnreadBadgeProps) {
  if (count < 1) {
    return null;
  }

  return (
    <span className="shrink-0 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-[10px] font-extrabold text-on-primary shadow-sm shadow-primary/30 animate-in zoom-in duration-300">
      {count > 99 ? "99+" : count}
    </span>
  );
}
