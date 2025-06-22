import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const BlogDetail = () => {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/api/blogs/${slug}`)
      .then((res) => setBlog(res.data))
      .catch((err) => console.error(err));
  }, [slug]);

  if (!blog) return <p className="text-center mt-20">Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-4xl font-bold mb-2">{blog.title}</h1>
      <p className="text-sm text-gray-600 mb-4">by {blog.author}</p>

      {blog.imageUrl && (
        <img
          src={`${process.env.REACT_APP_API_URL}${blog.imageUrl}`}
          alt={blog.title}
          className="w-full rounded-md mb-6 max-h-96 object-cover"
        />
      )}

      <div
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: blog.content }}
        
      />
    </div>
    
  );
};

export default BlogDetail;
