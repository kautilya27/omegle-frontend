import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

const BlogDetail = () => {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [suggested, setSuggested] = useState([]);

  useEffect(() => {
    axios
     .get(`${process.env.REACT_APP_API_URL}/api/blogs/${slug}`)
      .then((res) => {
        setBlog(res.data.blog);
        setSuggested(res.data.suggested);
      })
      .catch((err) => console.error(err));
  }, [slug]);

  if (!blog) return <p className="text-center mt-20">Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">{blog.title}</h1>
      <p className="text-sm text-gray-500">by {blog.author}</p>
      {blog.imageUrl && (
        <img
           src={`${process.env.REACT_APP_API_URL}${blog.imageUrl}`}
          alt=""
          className="my-4 w-full max-h-96 object-cover rounded"
        />
      )}
      <div
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: blog.content }}
      />

      {/* Suggested Posts */}
      <div className="mt-12">
        <h3 className="text-xl font-semibold mb-4 border-b pb-2">Suggested Posts</h3>
        <div className="space-y-3">
          {suggested.map((s) => (
            <Link
              key={s._id}
              to={`/blog/${s.slug}`}
              className="block p-4 border rounded hover:bg-gray-100 transition"
            >
              <h4 className="font-bold text-lg">{s.title}</h4>
              <p className="text-sm text-gray-500">by {s.author}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlogDetail;
