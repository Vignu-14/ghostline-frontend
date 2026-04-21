type AvatarProps = {
  src?: string | null;
  alt: string;
  size?: "sm" | "md" | "lg";
};

const AVATAR_GRADIENTS = [
  "var(--avatar-1)",
  "var(--avatar-2)",
  "var(--avatar-3)",
  "var(--avatar-4)",
  "var(--avatar-5)",
];

function getGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

export function Avatar({ src, alt, size = "md" }: AvatarProps) {
  return (
    <span className={`avatar avatar--${size}`}>
      {src ? (
        <img src={src} alt={alt} loading="lazy" />
      ) : (
        <span style={{ background: getGradient(alt) }}>
          {alt.slice(0, 1).toUpperCase()}
        </span>
      )}
    </span>
  );
}
