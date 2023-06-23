export interface Attribute {
  display_type?: string;
  max_value?: number;
  trait_type: string;
  value: string | number;
}

export interface Metadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  youtube_url?: string;
  attributes: Attribute[];
}

export interface RoosterMetadata extends Metadata {
  breed: number;
}

export interface GaffMetadata extends Metadata {
  gaffType: number;
}

export interface GemMetadata extends Metadata {
  gemType: number;
}
