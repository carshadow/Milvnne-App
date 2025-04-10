import React, { useState } from "react";

const ProductImage = ({ mainImage, additionalImages = [] }) => {
    const [selectedImage, setSelectedImage] = useState(mainImage);

    return (
        <div className="relative">
            {/* Main Image */}
            <img
                src={selectedImage}
                alt="Product"
                className="w-full h-auto object-contain rounded-lg border-2 border-indigo-600"
            />

            {/* Thumbnail Images */}
            <div className="mt-4 flex gap-4 overflow-x-auto">
                {additionalImages.map((img, index) => (
                    <img
                        key={index}
                        src={img}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-md cursor-pointer"
                        onClick={() => setSelectedImage(img)}  // Update selected image when clicked
                    />
                ))}
            </div>
        </div>
    );
};

export default ProductImage;
