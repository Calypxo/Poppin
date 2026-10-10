import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, LoaderCircle, Upload, X } from "lucide-react";
import { uploadImage } from "../../services/uploadService";
import { errorMessage } from "../../hooks/useResource";
import { MAX_POST_IMAGES } from "../../utils/announcementImages";
import Alert from "../ui/Alert";
import Button from "../ui/Button";
import IconButton from "../ui/IconButton";
import { useUI } from "../ui/context";
import ImagePreview from "../shared/ImagePreview";

interface PendingImage {
  file: File;
  preview: string;
}

export default function PostImageUploader({
  value,
  onChange,
  onBusy,
  disabled = false,
  error,
}: {
  value: string[];
  onChange: (images: string[]) => void;
  onBusy?: (busy: boolean) => void;
  disabled?: boolean;
  error?: string;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const active = useRef(true);
  const uploading = useRef(false);
  const previews = useRef(new Set<string>());
  const [pending, setPending] = useState<PendingImage[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [failures, setFailures] = useState<string[]>([]);
  const { toast } = useUI();

  useEffect(() => {
    active.current = true;
    const urls = previews.current;
    return () => {
      active.current = false;
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
      onBusy?.(false);
    };
  }, [onBusy]);

  async function addImages(files: File[]) {
    if (uploading.current || disabled || !files.length) return;
    const available = MAX_POST_IMAGES - value.length;
    const issues: string[] = [];
    const accepted: PendingImage[] = [];
    for (const file of files) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        issues.push(`${file.name}: choose a JPG, PNG or WEBP image.`);
      } else if (file.size > 5 * 1024 * 1024) {
        issues.push(`${file.name}: image must be 5 MB or less.`);
      } else if (accepted.length >= available) {
        issues.push(`${file.name}: an update can have up to ${MAX_POST_IMAGES} images.`);
      } else {
        const preview = URL.createObjectURL(file);
        previews.current.add(preview);
        accepted.push({ file, preview });
      }
    }
    setFailures(issues);
    setProgress("");
    if (!accepted.length) return;
    uploading.current = true;
    setBusy(true);
    onBusy?.(true);
    setPending(accepted);
    const images = [...value];
    let uploaded = 0;
    try {
      for (const [index, entry] of accepted.entries()) {
        if (!active.current) break;
        setProgress(`Uploading image ${index + 1} of ${accepted.length}…`);
        try {
          const result = await uploadImage(entry.file);
          if (!active.current) break;
          images.push(result.secureUrl);
          onChange([...images]);
          uploaded += 1;
        } catch (uploadError) {
          if (!active.current) break;
          issues.push(`${entry.file.name}: ${errorMessage(uploadError)}`);
          setFailures([...issues]);
        } finally {
          if (active.current) {
            setPending((entries) => entries.filter((item) => item !== entry));
          }
          URL.revokeObjectURL(entry.preview);
          previews.current.delete(entry.preview);
        }
      }
    } finally {
      uploading.current = false;
      if (active.current) {
        setBusy(false);
        setPending([]);
        onBusy?.(false);
        const message = uploaded
          ? `${uploaded} ${uploaded === 1 ? "image uploaded" : "images uploaded"}. Save or publish your update when ready.`
          : "No images were uploaded. Choose the failed images to try again.";
        setProgress(message);
        if (uploaded) toast.success(message);
      }
    }
  }

  return (
    <section className="poppin-post-uploader" aria-labelledby={`${id}-label`}>
      <div className="poppin-post-uploader-heading">
        <strong id={`${id}-label`}><ImagePlus size={18} aria-hidden="true" />Post images (optional)</strong>
        <span>{value.length} / {MAX_POST_IMAGES}</span>
      </div>
      <p id={`${id}-hint`} className="poppin-field-help">Select multiple JPG, PNG or WEBP images, up to 5 MB each. Images appear in the order you choose them.</p>
      {(value.length > 0 || pending.length > 0) && (
        <ol className="poppin-post-upload-grid" aria-label="Images in this update">
          {value.map((image, index) => (
            <li key={`${image}-${index}`}>
              <ImagePreview src={image} alt={`Post image ${index + 1}`} title={`Post image ${index + 1}`} />
              <div className="poppin-post-upload-caption">
                <span>Image {index + 1}</span>
                <IconButton variant="outline" aria-label={`Remove image ${index + 1}`} disabled={busy || disabled}
                  onClick={() => {
                    onChange(value.filter((_, imageIndex) => imageIndex !== index));
                    setProgress("");
                    toast.info("Image removed from this update.");
                  }}><X size={16} aria-hidden="true" /></IconButton>
              </div>
            </li>
          ))}
          {pending.map((entry) => (
            <li key={entry.preview} aria-busy="true">
              <div className="poppin-post-pending-image"><img src={entry.preview} alt={`Uploading ${entry.file.name}`} /></div>
              <div className="poppin-post-upload-caption"><span title={entry.file.name}>{entry.file.name}</span><LoaderCircle size={17} aria-hidden="true" className="motion-safe:animate-spin" /></div>
            </li>
          ))}
        </ol>
      )}
      <Button disabled={busy || disabled || value.length >= MAX_POST_IMAGES} loading={busy}
        icon={<Upload size={16} aria-hidden="true" />} onClick={() => input.current?.click()}>
        {busy ? "Uploading images…" : value.length ? "Add images" : "Choose images"}
      </Button>
      <input id={`${id}-input`} ref={input} type="file" multiple accept="image/jpeg,image/png,image/webp" hidden
        aria-label="Choose post images" aria-describedby={`${id}-hint`} disabled={busy || disabled || value.length >= MAX_POST_IMAGES}
        onChange={(event) => {
          const files = Array.from(event.currentTarget.files || []);
          event.currentTarget.value = "";
          void addImages(files);
        }} />
      <p className="poppin-post-upload-status" role="status">{progress || (value.length >= MAX_POST_IMAGES ? "Image limit reached. Remove an image to add another." : "")}</p>
      {(failures.length > 0 || error) && <Alert variant="error">
        {error && <p>{error}</p>}
        {failures.length > 0 && <><strong>Some images could not be added.</strong><ul>{failures.map((issue, index) => <li key={index}>{issue}</li>)}</ul><p>Your uploaded images are kept. Choose the failed images again to retry.</p></>}
      </Alert>}
    </section>
  );
}
