import { Button } from "../common/Button";

type LikeButtonProps = {
  liked: boolean;
  count: number;
  onToggle: () => void;
  disabled?: boolean;
};

export function LikeButton({ liked, count, onToggle, disabled }: LikeButtonProps) {
  return (
    <Button className="like-button" disabled={disabled} variant="ghost" onClick={onToggle} type="button">
      <span aria-hidden="true" style={{ color: liked ? '#ef4444' : undefined }}>{liked ? "♥" : "♡"}</span>
      <span>{count}</span>
    </Button>
  );
}
