import React, { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

const QuillEditor = ({ value, onChange }) => {
  const editorRef = useRef(null);
  const quillInstance = useRef(null);

  useEffect(() => {
    if (editorRef.current && !quillInstance.current) {
      quillInstance.current = new Quill(editorRef.current, {
        theme: "snow",
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline"],
            [{ align: [] }],
            [{ list: "ordered" }, { list: "bullet" }],
            [{ color: [] }, { background: [] }],
            ["link", "image"],
          ],
        },
      });

      quillInstance.current.on("text-change", () => {
        const html = quillInstance.current.root.innerHTML;
        onChange(html);
      });
    }
  }, [onChange]);

  useEffect(() => {
    if (
      quillInstance.current &&
      value !== quillInstance.current.root.innerHTML
    ) {
      quillInstance.current.root.innerHTML = value || "";
    }
  }, [value]);

  return (
    <div
      ref={editorRef}
      style={{
        width: "100%",
        height: "90%",
        border: "1px solid #ccc",
        overflowY: "auto",
        borderRadius: "8px",
      }}
    ></div>
  );
};

export default QuillEditor;
