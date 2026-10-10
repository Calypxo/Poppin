import { useEffect, useId, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import IconButton from "../ui/IconButton";
import ImagePreview from "./ImagePreview";

function scrollState(gallery: HTMLUListElement) {
  return {
    previous: gallery.scrollLeft > 1,
    next: gallery.scrollLeft < gallery.scrollWidth - gallery.clientWidth - 1,
  };
}

export default function PostImageGallery({
  images,
  title,
  description,
}: {
  images: string[];
  title: string;
  description?: string;
}) {
  const galleryId = useId();
  const galleryRef = useRef<HTMLUListElement>(null);
  const [navigation, setNavigation] = useState({ previous: false, next: false });
  const scrollable = navigation.previous || navigation.next;

  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery) return;
    const observer = new ResizeObserver(() => setNavigation(scrollState(gallery)));
    observer.observe(gallery);
    if (gallery.firstElementChild) observer.observe(gallery.firstElementChild);
    return () => observer.disconnect();
  }, [images.length]);

  function scrollPhotos(direction: number) {
    const gallery = galleryRef.current;
    if (!gallery) return;
    gallery.scrollBy({
      left: direction * gallery.clientWidth,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }

  if (!images.length) return null;
  if (images.length === 1) {
    return (
      <ImagePreview
        className="poppin-update-image"
        src={images[0]}
        alt={title}
        title={title}
        description={description}
      />
    );
  }
  return (
    <figure className="poppin-post-gallery">
      <ul ref={galleryRef} id={galleryId} className="poppin-post-gallery-grid"
        aria-label={`Images for ${title}`} aria-describedby={`${galleryId}-hint`} tabIndex={0}
        onScroll={(event) => setNavigation(scrollState(event.currentTarget))}>
        {images.map((image, index) => (
          <li key={image}>
            <ImagePreview
              src={image}
              alt={`${title}, image ${index + 1} of ${images.length}`}
              title={`${title} — image ${index + 1} of ${images.length}`}
              description={description}
              fit="cover"
            />
          </li>
        ))}
      </ul>
      <figcaption className={scrollable ? "poppin-post-gallery-caption" : "sr-only"}>
        <span id={`${galleryId}-hint`}>
          {images.length} photos{scrollable ? " · Swipe or scroll to see more" : ". Select a photo to view it in full."}
        </span>
        {scrollable && <div className="poppin-post-gallery-controls">
          <IconButton variant="outline" aria-label="Previous photos" aria-controls={galleryId}
            disabled={!navigation.previous} onClick={() => scrollPhotos(-1)}>
            <ChevronLeft size={18} aria-hidden="true" />
          </IconButton>
          <IconButton variant="outline" aria-label="Next photos" aria-controls={galleryId}
            disabled={!navigation.next} onClick={() => scrollPhotos(1)}>
            <ChevronRight size={18} aria-hidden="true" />
          </IconButton>
        </div>}
      </figcaption>
    </figure>
  );
}
