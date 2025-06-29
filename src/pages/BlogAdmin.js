import React, { useState, useEffect } from "react";
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
  const [blogs, setBlogs] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSlug, setEditingSlug] = useState("");

  const fetchBlogs = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/blogs`);
      setBlogs(res.data);
    } catch (err) {
      console.error("Failed to fetch blogs", err);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

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
    setForm((prev) => ({ ...prev, content: value }));
  };

  const resetForm = () => {
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
    setIsEditing(false);
    setEditingSlug("");
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    for (let key in form) {
      formData.append(key, form[key]);
    }

    try {
      if (isEditing) {
        await axios.put(`${process.env.REACT_APP_API_URL}/api/blogs/${editingSlug}`, formData);
        alert("Blog updated successfully!");
      } else {
        await axios.post(`${process.env.REACT_APP_API_URL}/api/blogs`, formData);
        alert("Blog posted successfully!");
      }
      resetForm();
      fetchBlogs();
    } catch (err) {
      alert("Error submitting blog");
      console.error(err);
    }
  };

  const handleDelete = async (slug) => {
    if (!window.confirm("Are you sure you want to delete this blog?")) return;
    try {
       await axios.delete(`${process.env.REACT_APP_API_URL}/api/blogs/${slug}`);
      fetchBlogs();
    } catch (err) {
      console.error("Failed to delete blog", err);
    }
  };

  const handleEdit = (blog) => {
    setForm({
      slug: blog.slug,
      metaTitle: blog.metaTitle,
      metaDesc: blog.metaDesc,
      author: blog.author,
      title: blog.title,
      content: blog.content,
      image: null, // new image can be uploaded
    });
    setPreviewImage(blog.imageUrl ? `${process.env.REACT_APP_API_URL}${blog.imageUrl}` : null);
    setEditingSlug(blog.slug);
    setIsEditing(true);
  };

  return (
    <div className="p-6 space-y-8">
      {/* Form Section */}
      <div className="flex flex-col lg:flex-row gap-6">
        <form className="w-full lg:w-1/2 space-y-4" onSubmit={(e) => e.preventDefault()}>
          <input name="slug" placeholder="Slug" onChange={handleChange} value={form.slug} disabled={isEditing} className="w-full p-2 border rounded" />
          <input name="metaTitle" placeholder="Meta Title" onChange={handleChange} value={form.metaTitle} className="w-full p-2 border rounded" />
          <textarea name="metaDesc" placeholder="Meta Description" onChange={handleChange} value={form.metaDesc} className="w-full p-2 border rounded" />
          <input name="author" placeholder="Author" onChange={handleChange} value={form.author} className="w-full p-2 border rounded" />
          <input name="title" placeholder="Title" onChange={handleChange} value={form.title} className="w-full p-2 border rounded" />
          <input type="file" accept="image/*" onChange={handleImageChange} className="w-full p-2 border rounded" />

          <ReactQuill value={form.content} onChange={handleContentChange} className="bg-white" theme="snow" />

          <div className="flex gap-3">
            <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded">
              {isEditing ? "Update Blog" : "Publish Blog"}
            </button>
            {isEditing && (
              <button onClick={resetForm} className="px-4 py-2 bg-gray-400 text-white rounded">
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* Preview Section */}
        <div className="w-full lg:w-1/2 border p-4 rounded bg-gray-50">
          <h2 className="text-xl font-bold">{form.title}</h2>
          <p className="text-gray-500 text-sm">by {form.author}</p>
          {previewImage && <img src={previewImage} alt="Preview" className="my-2 max-h-64 rounded" />}
          <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: form.content }} />
        </div>
      </div>

      {/* Blog List Section */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">All Blogs</h3>
        <div className="space-y-4">
          {blogs.map((b) => (
            <div key={b._id} className="border p-4 rounded flex justify-between items-center">
              <div>
                <h4 className="font-semibold">{b.title}</h4>
                <p className="text-sm text-gray-500">by {b.author}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(b)} className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">
                  Edit
                </button>
                <button onClick={() => handleDelete(b.slug)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlogAdmin;
