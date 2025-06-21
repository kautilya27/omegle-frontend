import React from "react";
import { Link } from "react-router-dom";

const BlogCard = ({ blog }) => {
  return (
    <Link
      to={`/blog/${blog.slug}`}
      className="block mb-6 p-4 border rounded hover:bg-gray-50 transition"
    >
      <h2 className="text-xl font-semibold">{blog.title}</h2>
      <p className="text-sm text-gray-600 mb-1">by {blog.author}</p>
      {blog.imageUrl && (
        <img
          src={`http://localhost:4000${blog.imageUrl}`}
          alt={blog.title}
          className="w-full mt-2 max-h-48 object-cover rounded"
        />
      )}
      <p className="text-gray-700 mt-2 line-clamp-2">
        {blog.metaDesc || blog.content.slice(0, 100) + "..."}
      </p>
    </Link>
  );
};

export default BlogCard;
