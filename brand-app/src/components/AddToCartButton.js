const AddToCartButton = ({ selectedSize, quantity, product, addToCart, isSoldOut }) => {
    const handleAddToCart = () => {
        if (!selectedSize) {
            alert('Please select a size');
            return;
        }

        const stock = product.sizes[selectedSize];
        if (quantity > stock) {
            alert(`Only ${stock} items available for size ${selectedSize}`);
            return;
        }

        product.sizes[selectedSize] -= quantity;  // Update stock
        addToCart(product, selectedSize, quantity);
        alert('Item added to cart');
    };

    return (
        <button
            onClick={handleAddToCart}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
            disabled={isSoldOut}
        >
            Add to Cart
        </button>
    );
};

export default AddToCartButton;
