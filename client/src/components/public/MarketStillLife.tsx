import { WatercolorSticker } from "./MarketDecorations";

export default function MarketStillLife({
  eager = false,
}: {
  eager?: boolean;
}) {
  return (
    <div className="poppin-watercolor-tastes" aria-hidden="true">
      <WatercolorSticker
        motif="picnic-cloth"
        className="poppin-taste-cloth"
        eager={eager}
      />
      <WatercolorSticker
        motif="bilao"
        className="poppin-taste-bilao"
        eager={eager}
      />
      <WatercolorSticker
        motif="matcha-latte"
        className="poppin-taste-matcha"
        eager={eager}
      />
      <WatercolorSticker
        motif="croissant"
        className="poppin-taste-croissant"
        eager={eager}
      />
    </div>
  );
}
