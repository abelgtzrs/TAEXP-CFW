// Volume data model and form utilities — mirrors the server-side Volume model.

export type Blessing = {
  item: string;
  description: string;
  context?: string;
};

export type Volume = {
  _id: string;
  volumeNumber: number;
  title: string;
  bodyLines: string[];
  blessingIntro?: string;
  blessings: Blessing[];
  dream?: string;
  edition?: string;
  rawPastedText: string;
  status: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt?: string;
  favoriteCount?: number;
  averageRating?: number;
  ratingCount?: number;
};

export type VolumeFormData = {
  rawPastedText: string;
  status: "draft" | "published" | "archived";
  volumeNumber: string | number;
  title: string;
  /** Multiline body text joined by newlines; converted to bodyLines[] on save */
  bodyText: string;
  blessingIntro: string;
  blessings: Blessing[];
  dream: string;
  edition: string;
};

export type VolumePayload = {
  rawPastedText: string;
  status: string;
  volumeNumber: number | null;
  title: string;
  bodyLines: string[];
  blessingIntro: string;
  blessings: Blessing[];
  dream: string;
  edition: string;
};

export const INITIAL_VOLUME_FORM: VolumeFormData = {
  rawPastedText: "",
  status: "draft",
  volumeNumber: "",
  title: "",
  bodyText: "",
  blessingIntro: "",
  blessings: [],
  dream: "",
  edition: "",
};

/** Convert a server Volume document into the editor form state */
export function toFormData(volume: Volume): VolumeFormData {
  return {
    rawPastedText: volume.rawPastedText || "",
    status: volume.status || "draft",
    volumeNumber: volume.volumeNumber ?? "",
    title: volume.title ?? "",
    bodyText: Array.isArray(volume.bodyLines) ? volume.bodyLines.join("\n") : "",
    blessingIntro: volume.blessingIntro ?? "",
    blessings: Array.isArray(volume.blessings) ? volume.blessings.map((b) => ({ ...b })) : [],
    dream: volume.dream ?? "",
    edition: volume.edition ?? "",
  };
}

/** Convert form state back into a server payload */
export function toPayload(formData: VolumeFormData): VolumePayload {
  return {
    rawPastedText: formData.rawPastedText,
    status: formData.status,
    volumeNumber: formData.volumeNumber === "" ? null : Number(formData.volumeNumber),
    title: formData.title,
    bodyLines: (formData.bodyText || "").split(/\r?\n/).map((l) => l.trimEnd()),
    blessingIntro: formData.blessingIntro,
    blessings: Array.isArray(formData.blessings) ? formData.blessings : [],
    dream: formData.dream,
    edition: formData.edition,
  };
}
