const QuantitySelector = ({ quantity, setQuantity, isSoldOut }) => {
    return (
        <div className="mt-4">
            <label htmlFor="quantity" className="block text-lg font-semibold">Quantity</label>
            <input
                type="number"
                id="quantity"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
                className="mt-2 px-4 py-2 border rounded-md w-20 bg-gray-800 text-white"
                disabled={isSoldOut}
            />
        </div>
    );
};

export default QuantitySelector;
