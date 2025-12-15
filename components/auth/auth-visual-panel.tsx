"use client";

import { PixelatedCanvas } from "../layout/pixelated-canvas";

export default function AuthVisualPanel() {
  return (
    <div className="hidden relative overflow-hidden lg:flex min-h-full lg:justify-center lg:items-center p-8 lg:p-16">
      <div className="rounded-2xl ">
        <PixelatedCanvas
          src={"/visual.jpg"}
          width={800}
          height={1000}
          cellSize={3}
          dotScale={0.9}
          shape="circle"
          responsive
          backgroundColor="#000000"
          dropoutStrength={0.4}
          interactive
          distortionStrength={3}
          distortionRadius={80}
          distortionMode="swirl"
          objectFit="cover"
          followSpeed={0.2}
          jitterStrength={4}
          jitterSpeed={4}
          sampleAverage
          tintColor="#FFFFFF"
          tintStrength={0.2}
          className="rounded-xl"
        />
      </div>
    </div>
  );
}
