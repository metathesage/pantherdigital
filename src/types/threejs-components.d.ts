declare module "threejs-components/build/cursors/tubes1.min.js" {
  const TubesCursor: new (
    canvas: HTMLCanvasElement,
    opts?: { tubes?: Record<string, unknown> }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => any;
  export default TubesCursor;
}
