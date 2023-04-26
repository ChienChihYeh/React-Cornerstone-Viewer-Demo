import React, { useEffect, useRef } from "react";
import axios from "axios";
// import * as Zlib from "zlibjs";
import pako from "pako";

export default function NewNodule({
  newNodule,
  scale,
  viewX,
  viewY,
  imageSize,
  currentImageIdIndex,
}) {
  const newNoduleRef = useRef(null);

  useEffect(() => {
    newNoduleRef.current.style.transform = `translate(${viewX * scale}px, ${
      viewY * scale
    }px) scale(${scale})`;

    // console.log("newNodule scale", scale);
  }, [scale, viewX, viewY]);

  useEffect(() => {
    let canvas = newNoduleRef.current;

    if (newNodule.coord_X !== "") {
      //   console.log(JSON.stringify(newNodule)); //ok

      let formData = new FormData();
      formData.append("StudyDate", newNodule.studyDate);
      formData.append("PatientID", newNodule.patientID);
      formData.append("coord_x", newNodule.coord_X);
      formData.append("coord_y", newNodule.coord_Y);
      formData.append("slicepath", newNodule.slice_path);

      axios
        .post("http://10.20.19.148:18000/connected_segment", formData)
        .then((response) => {
          // console.log(response.data); //ook

          //processing data
          const npy_data = response.data["base64_data"].slice(2, -1);
          //   console.log(npy_data); //ok
          let strData = atob(npy_data);
          //   console.log(strData); //ok

          let data = new Array(strData.length);
          for (let i = 0, il = strData.length; i < il; ++i) {
            data[i] = strData.charCodeAt(i);
          }

          let inflatedData = pako.inflate(data);
          let connected_segment_array = new Uint8Array(inflatedData.buffer);

          console.log(connected_segment_array);

          let width = imageSize;
          let height = imageSize;
          let buffer = new Uint8ClampedArray(width * height * 4);

          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              let arr_pos = y * width + x; // position in buffer based on x and y
              let pos = (y * width + x) * 4;
              if (parseInt(connected_segment_array[arr_pos]) > 0) {
                buffer[pos] = 255; // some R value [0, 255]
                buffer[pos + 1] = 128; // some G value
                buffer[pos + 2] = 0; // some B value
                buffer[pos + 3] = 100; // set alpha channel
              }
            }
          }

          let ctx = canvas.getContext("2d");

          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.restore();

          // create imageData object
          let idata = ctx.createImageData(width, height);

          // set our buffer as source
          idata.data.set(buffer);
          ctx.putImageData(idata, 0, 0);
        });
    }

    return () => {
      let ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [newNodule]);

  useEffect(() => {
    let canvas = newNoduleRef.current;
    let ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [currentImageIdIndex]);

  return (
    <canvas
      style={{
        position: "absolute",
        // top: "128px", // place at center to check sync
        // left: "128px", // place at center to check sync
        // backgroundColor: "#ff000050",
        // width: imageSize / 2, // place at center to check sync
        // height: imageSize / 2, // place at center to check sync
        width: imageSize,
        height: imageSize,
      }}
      width={512}
      height={512}
      ref={newNoduleRef}
    ></canvas>
  );
}
