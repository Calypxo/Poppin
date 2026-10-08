import { Fragment, type CSSProperties } from "react";

// Word entrances inspired by React Bits' Split Text, using native CSS animation.
// Real text and spaces remain intact for selection and assistive technology.
export default function TextReveal({ text, delay = 0, className = "" }: {
  text: string;
  delay?: number;
  className?: string;
}) {
  return (
    <span className={`poppin-text-reveal ${className}`}>
      {text.split(/\s+/).map((word, index) => (
        <Fragment key={`${index}-${word}`}>
          {index > 0 && " "}
          <span className="poppin-reveal-word" style={{
            "--word-delay": `${delay + Math.min(index, 8) * 45}ms`,
          } as CSSProperties}>{word}</span>
        </Fragment>
      ))}
    </span>
  );
}
