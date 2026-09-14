import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { Image as KonvaImage } from "react-konva";
import "gifler";
const gifler = window.gifler;

const KonvaGif = forwardRef(({ src, x, y, width, height, ...rest }, ref) => {
  const internalImageRef = useRef(null);
  const [canvas] = useState(() => document.createElement('canvas'));

  useImperativeHandle(ref, () => internalImageRef.current);

  useEffect(() => {
    let anim;
    let isMounted = true;

    if (src) {
      try {
        gifler(src).get(a => {
          if (!isMounted) return;
          anim = a;
          // Set canvas size to the gif's natural size
          canvas.width = anim._frames[0].width;
          canvas.height = anim._frames[0].height;
          
          anim.animateInCanvas(canvas);
          anim.onDrawFrame = (ctx, frame) => {
            if (!isMounted) return;
            ctx.drawImage(frame.buffer, frame.x, frame.y);
            // Force konva layer to redraw
            if (internalImageRef.current) {
              const layer = internalImageRef.current.getLayer();
              if (layer) {
                layer.batchDraw();
              }
            }
          };
        });
      } catch (err) {
        console.error("Error loading GIF with gifler:", err);
      }
    }

    return () => {
      isMounted = false;
      if (anim) {
        anim.stop();
      }
    };
  }, [src, canvas]);

  return <KonvaImage image={canvas} x={x} y={y} width={width} height={height} ref={internalImageRef} {...rest} />;
});

export default KonvaGif;
