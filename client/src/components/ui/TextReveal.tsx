import { Fragment, type CSSProperties, type ReactNode } from "react";

// Word entrances inspired by React Bits' Split Text, using native CSS animation.
// Real text and spaces remain intact for selection and assistive technology.
export default function TextReveal({ text, delay = 0, className = "", suffix }: {
  text: string;
  delay?: number;
  className?: string;
  suffix?: ReactNode;
}) {
  const words = [...text.matchAll(/\S+/g)];
  return (
    <span className={`poppin-text-reveal ${className}`}>
      {words.map((match, index) => (
        <Fragment key={text.slice(0, match.index + match[0].length)}>
          {index > 0 && " "}
          <span className="poppin-reveal-word" style={{
            "--word-delay": `${delay + Math.min(index, 8) * 45}ms`,
          } as CSSProperties}>{match[0]}{index === words.length - 1 && suffix}</span>
        </Fragment>
      ))}
    </span>
  );
}
