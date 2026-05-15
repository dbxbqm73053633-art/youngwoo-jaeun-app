import { forwardRef } from "react";

type LyricLineProps = {
  distance?: number;
  isActive?: boolean;
  index: number;
  text: string;
  isTag?: boolean;
};

const LyricLine = forwardRef<HTMLDivElement, LyricLineProps>(function LyricLine(
  { distance = 0, isActive = false, index, text, isTag = false },
  ref,
) {
  const classes = ["lyrics__line"];
  if (isTag) classes.push("lyrics__line--tag");
  if (isActive) classes.push("lyrics__line--active");
  if (distance === 1) classes.push("lyrics__line--near");
  if (distance > 2) classes.push("lyrics__line--far");

  return (
    <div ref={ref} className={classes.join(" ")} data-idx={index}>
      {text}
    </div>
  );
});

export default LyricLine;
