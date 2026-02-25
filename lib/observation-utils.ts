import type { MinariDataset } from "@/lib/minari-data"

export function supportsObservationRendering(dataset: MinariDataset): boolean {
  return dataset.namespace === "Atari"
}
