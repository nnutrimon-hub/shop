"use client";
import { getImageUrl } from "@/lib/cloudinary";
import Image from "next/image";
import { useState } from "react";

interface Props {
  imageKeys: string[];
  name: string;
}

export default function ImageGallery({ imageKeys, name }: Props) {
  const [active, setActive] = useState(0);

  return (
    <div className="flex gap-3">
      {/* Vertical thumbnail strip */}
      <div className="flex flex-col gap-2 overflow-y-auto max-h-[480px] pr-1">
        {imageKeys.map((key, i) => (
          <button
            key={key}
            type="button"
            onClick={() => setActive(i)}
            className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
              active === i
                ? "border-primary"
                : "border-transparent hover:border-primary/40"
            }`}
          >
            <Image
              src={getImageUrl(key, { width: 128 })}
              alt={`${name} ${i + 1}`}
              fill
              className="object-cover"
            />
          </button>
        ))}
      </div>

      {/* Main image */}
      <div className="relative flex-1 aspect-square rounded-2xl overflow-hidden bg-muted">
        <Image
          src={getImageUrl(imageKeys[active] ?? "", { width: 700 })}
          alt={name}
          fill
          className="object-cover transition-opacity duration-200"
          priority
        />
      </div>
    </div>
  );
}
