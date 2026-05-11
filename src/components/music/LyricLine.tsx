import { forwardRef } from "react";

type LyricLineProps = {
  isActive?: boolean;
  index: number;
  text: string;
  isTag?: boolean;
};

const LyricLine = forwardRef<HTMLDivElement, LyricLineProps>(function LyricLine(
  { isActive = false, index, text, isTag = false },
  ref,
) {
  const classes = ["lyrics__line"];
  if (isTag) classes.push("lyrics__line--tag");
  if (isActive) classes.push("lyrics__line--active");

  return (
    <div ref={ref} className={classes.join(" ")} data-idx={index}>
      {text}
    </div>
  );
});

export default LyricLine;
