import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPostById } from "../../../../services/admin/post";

const PostDetails = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    images: [],
    mediaTypes: [],
    video: null,
  });

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const post = await getPostById(id);
        const images = post.images || [];
        const mediaTypes = images.map(img => determineMediaType(img));

        setFormData({
          ...post,
          images,
          mediaTypes,
          video: post.video || null
        });
      } catch (error) {
        console.error("Error fetching post:", error);
      }
    };

    fetchPost();
  }, [id]);

  const determineMediaType = (url) => {
    const extension = url.split(".").pop().toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) {
      return "image/jpeg";
    }
    if (["mp4", "mov", "avi", "wmv"].includes(extension)) {
      return "video/mp4";
    }
    return "unknown";
  };

  const isImageFile = (url, index) => {
    if (formData.mediaTypes && formData.mediaTypes[index]) {
      return formData.mediaTypes[index].startsWith("image");
    }
    return determineMediaType(url).startsWith("image");
  };

  return (
    <div>
      <h1>Post Details</h1>
      <div>
        {formData.images.map((url, index) => (
          <div key={index}>
            {isImageFile(url, index) ? (
              <img src={url} alt="Post Media" style={{ width: "200px" }} />
            ) : (
              <video controls style={{ width: "200px" }}>
                <source src={url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        ))}
      </div>
      {formData.video && (
        <div>
          <video controls style={{ width: "400px" }}>
            <source src={formData.video} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}
    </div>
  );
};

export default PostDetails;
