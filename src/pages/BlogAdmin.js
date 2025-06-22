import React, { useState } from "react";
import axios from "axios";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const BlogAdmin = () => {
  const [form, setForm] = useState({
    slug: "",
    metaTitle: "",
    metaDesc: "",
    author: "",
    title: "",
    content: "",
    image: null,
  });

  const [previewImage, setPreviewImage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setForm((prev) => ({ ...prev, image: file }));
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleContentChange = (value) => {
    // ReactQuill sends real HTML
    setForm((prev) => ({ ...prev, content: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    for (let key in form) {
      formData.append(key, form[key]);
    }

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/blogs`, formData);
      alert("Blog posted successfully!");
      // Clear form (optional)
      setForm({
        slug: "",
        metaTitle: "",
        metaDesc: "",
        author: "",
        title: "",
        content: "",
        image: null,
      });
      setPreviewImage(null);
    } catch (err) {
      alert("Error posting blog");
      console.error(err);
    }
  };

  return (
    <div className="p-6 flex flex-col lg:flex-row gap-6">
      {/* Form Section */}
      
      <form
        className="w-full lg:w-1/2 space-y-4"
        onSubmit={handleSubmit}
        encType="multipart/form-data"
      >
        <input
          name="slug"
          placeholder="Slug"
          onChange={handleChange}
          value={form.slug}
          className="w-full p-2 border rounded"
        />
        <input
          name="metaTitle"
          placeholder="Meta Title"
          onChange={handleChange}
          value={form.metaTitle}
          className="w-full p-2 border rounded"
        />
        <textarea
          name="metaDesc"
          placeholder="Meta Description"
          onChange={handleChange}
          value={form.metaDesc}
          className="w-full p-2 border rounded"
        />
        <input
          name="author"
          placeholder="Author"
          onChange={handleChange}
          value={form.author}
          className="w-full p-2 border rounded"
        />
        <input
          name="title"
          placeholder="Title"
          onChange={handleChange}
          value={form.title}
          className="w-full p-2 border rounded"
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full p-2 border rounded"
        />
        
        {/* ReactQuill for rich content */}
        <ReactQuill
          theme="snow"
          value={form.content}
          onChange={handleContentChange}
          className="bg-white h-48"
        />
        
        {console.log("CONTENT BEFORE SUBMIT:", form.content)}
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Publish Blog
        </button>
      </form>

      {/* Live Preview Section */}
      <div className="w-full lg:w-1/2 border p-4 rounded bg-gray-50">
        <h2 className="text-xl font-bold">{form.title}</h2>
        <p className="text-gray-500 text-sm">by {form.author}</p>
        {previewImage && (
          <img
            src={previewImage}
            alt="Preview"
            className="my-2 max-h-64 object-contain rounded"
          />
        )}
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: form.content }}
        ></div>
      </div>
    </div>
  );
};

export default BlogAdmin;
