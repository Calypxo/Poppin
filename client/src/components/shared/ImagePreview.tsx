import { useState, type ReactNode } from "react";
import { Expand, ImageOff } from "lucide-react";
import Modal from "../ui/Modal";

export default function ImagePreview({
  src,
  alt,
  title,
  description,
  className = "",
  fit = "contain",
  footer,
}: {
  src: string;
  alt: string;
  title: string;
  description?: string;
  className?: string;
  fit?: "contain" | "cover";
  footer?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [failedUrl, setFailedUrl] = useState("");
  const failed = failedUrl === src;
  return (
    <>
      <button type="button" className={`poppin-image-preview ${className}`}
        aria-label={`View image: ${title}`} aria-haspopup="dialog"
        onClick={() => setOpen(true)}>
        {failed ? <span className="poppin-image-unavailable"><ImageOff size={24} aria-hidden="true" />Image unavailable</span>
          : <img src={src} alt={alt} loading="lazy" decoding="async"
              style={{ objectFit: fit }} onError={() => setFailedUrl(src)} />}
        <span className="poppin-image-expand"><Expand size={16} aria-hidden="true" /><span>View image</span></span>
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={title} description={description} size="xl" footer={footer}>
        {failed ? <p className="poppin-image-unavailable"><ImageOff size={24} aria-hidden="true" />This image is unavailable. Please try again later.</p>
          : <img className="poppin-image-full" src={src} alt={alt} onError={() => setFailedUrl(src)} />}
      </Modal>
    </>
  );
}
