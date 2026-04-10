export type BoardTheme = {
  name: string;
  backgroundImage: string;
  /** Displayed image dimensions (after any EXIF rotation). */
  imageWidth: number;
  imageHeight: number;
  /** Distance from image edges to the hex grid edges, in image pixels. */
  imagePadding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
};
