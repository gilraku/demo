export type GraphicsProbe = {
  available: boolean;
  antialias: boolean;
  reason: string;
};

export function probeWebGL(canvas: HTMLCanvasElement): GraphicsProbe {
  let reason = "Browser belum berhasil membuat konteks WebGL 2.";
  const onError = (event: Event) => {
    const message = (event as WebGLContextEvent).statusMessage;
    if (message) reason = message;
  };
  canvas.addEventListener("webglcontextcreationerror", onError);
  try {
    for (const antialias of [true, false]) {
      try {
        const context = canvas.getContext("webgl2", {
          antialias,
          alpha: true,
          powerPreference: "default",
          failIfMajorPerformanceCaveat: false,
        });
        if (context) {
          context.getExtension("WEBGL_lose_context")?.loseContext();
          return { available: true, antialias, reason: "" };
        }
      } catch (error) {
        if (error instanceof Error) reason = error.message;
      }
    }
    return { available: false, antialias: false, reason };
  } finally {
    canvas.removeEventListener("webglcontextcreationerror", onError);
  }
}
