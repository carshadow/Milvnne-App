const SizeSelector = ({ sizes, selectedSize, setSelectedSize }) => {
    if (!sizes || Object.keys(sizes).length === 0) {
        return <p className="text-gray-500">No sizes available.</p>;
    }

    return (
        <div className="mt-4">
            <h3 className="text-lg font-semibold text-indigo-300">Available Sizes</h3>
            <div className="flex gap-2 mt-2">
                {Object.entries(sizes).map(([size, stock]) => (
                    <span
                        key={size}
                        onClick={() => stock > 0 && setSelectedSize(size)}
                        className={`px-4 py-2 border rounded-md cursor-pointer ${selectedSize === size ? 'bg-indigo-600' : 'bg-gray-800 hover:bg-indigo-500'
                            } ${stock === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {stock === 0 ? `${size} (Sold Out)` : size}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default SizeSelector;
