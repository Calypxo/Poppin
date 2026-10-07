export type WatercolorMotif =
  | "hair-clip"
  | "flower-bouquet"
  | "dessert-cups"
  | "matcha-latte"
  | "croissant"
  | "picnic-cloth"
  | "bilao"
  | "lace-cardigan"
  | "leather-shoes"
  | "craft-booth"
  | "flower-market-booth"
  | "sandwich"
  | "camera-reference"
  | "map-pin"
  | "woven-bracelets"
  | "dumpling-squishy"
  | "vinyl-reference"
  | "book-stack"
  | "printed-shirt";

export function WatercolorSticker({
  motif,
  className = "",
  eager = false,
}: {
  motif: WatercolorMotif;
  className?: string;
  eager?: boolean;
}) {
  return (
    <img
      src={"/watercolor/" + motif + ".webp"}
      alt=""
      aria-hidden="true"
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      className={"poppin-watercolor-cutout " + className}
    />
  );
}

export function BotanicalDivider() {
  return <div className="poppin-botanical-divider" aria-hidden="true" />;
}

export function LocalFindsIllustrations() {
  return (
    <div className="poppin-watercolor-finds" aria-hidden="true">
      <WatercolorSticker
        motif="lace-cardigan"
        className="poppin-find-cardigan"
      />
      <WatercolorSticker motif="leather-shoes" className="poppin-find-shoes" />
      <WatercolorSticker
        motif="flower-bouquet"
        className="poppin-find-bouquet"
      />
      <WatercolorSticker
        motif="camera-reference"
        className="poppin-find-camera"
      />
      <WatercolorSticker motif="hair-clip" className="poppin-find-clip" />
      <span className="poppin-find-caption">good finds, close to home.</span>
    </div>
  );
}

export function LocalFindsShelf() {
  const motifs: WatercolorMotif[] = [
    "printed-shirt",
    "book-stack",
    "vinyl-reference",
    "dumpling-squishy",
    "woven-bracelets",
  ];
  return (
    <div className="poppin-finds-shelf lg:col-span-2" aria-hidden="true">
      {motifs.map((motif) => (
        <WatercolorSticker key={motif} motif={motif} />
      ))}
    </div>
  );
}
