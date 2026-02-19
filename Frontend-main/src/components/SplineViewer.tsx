export default function SplineViewer() {
  return (
    <div className="w-full h-full min-h-[120px] relative overflow-hidden rounded-xl">
      {/* @ts-expect-error - spline-viewer is a web component loaded via CDN script */}
      <spline-viewer
        url="https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
    </div>
  );
}
