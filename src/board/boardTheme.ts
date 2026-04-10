/**
 * Visual theme for a board map background image.
 *
 * Adding a new board:
 * 1. Place the image in public/ (e.g. public/my-board.jpg).
 * 2. Measure from the image (in image pixels):
 *    - imageWidth / imageHeight — displayed dimensions (after EXIF rotation).
 *    - imagePadding — distance from each image edge to the hex grid edge.
 * 3. Create a BoardTheme and pass it via the boardTheme prop.
 *
 * The renderer automatically scales and positions the image so the hex
 * grid in the image aligns with the rendered hex overlay. No manual CSS
 * needed.
 *
 * Use public/debug-board-overlay.html to verify alignment by overlaying
 * circles on the image at computed hex center positions.
 *
 * @example
 * ```ts
 * export const myBoardTheme: BoardTheme = {
 *   name: "Embergard Board 1",
 *   backgroundImage: "/embergard-board-1.jpg",
 *   imageWidth: 1368,
 *   imageHeight: 1500,
 *   imagePadding: { top: 32, right: 29, bottom: 30, left: 24 },
 * };
 * ```
 */
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
