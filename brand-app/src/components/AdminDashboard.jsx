import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaTimes } from 'react-icons/fa';

const AdminDashboard = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const token = localStorage.getItem("token");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);

    const [newProduct, setNewProduct] = useState({
        name: "",
        price: "",
        category: "",
        description: "",
        coverImage: null,
        hoverImage: null,
        images: [],
        sizes: { S: 0, M: 0, L: 0, XL: 0 },
        stock: 0,
        hasSizes: true
    });

    const [editingProduct, setEditingProduct] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState("");
    const [newCategoryImage, setNewCategoryImage] = useState(null);


    const fetchProducts = async () => {
        try {
            const res = await fetch("http://localhost:8080/api/products", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(`HTTP Error! Status: ${res.status}`);
            const data = await res.json();
            setProducts(data);
        } catch (error) {
            console.error("Error fetching products:", error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch("http://localhost:8080/api/categories");
            const data = await res.json();
            setCategories(data.sort((a, b) => a.order - b.order));
        } catch (err) {
            console.error("Error fetching categories:", err);
        }
    };

    const createCategory = async () => {
        if (!newCategory || !newCategoryImage) return;
        const formData = new FormData();
        formData.append("name", newCategory);
        formData.append("image", newCategoryImage);
        try {
            const res = await fetch("http://localhost:8080/api/categories", {
                method: "POST",
                body: formData,
            });
            if (res.ok) {
                setNewCategory("");
                setNewCategoryImage(null);
                fetchCategories();
            }
        } catch (err) {
            console.error("Error creating category:", err);
        }
    };

    const updateCategoryImage = async (id, file) => {
        const formData = new FormData();
        formData.append("image", file);
        try {
            await fetch(`http://localhost:8080/api/categories/${id}/image`, {
                method: "PUT",
                body: formData,
            });
            fetchCategories();
        } catch (err) {
            console.error("Error updating image:", err);
        }
    };

    const renameCategory = async (id, newName) => {
        try {
            await fetch(`http://localhost:8080/api/categories/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName }),
            });
            fetchCategories();
        } catch (err) {
            console.error("Rename failed", err);
        }
    };

    const deleteCategory = async (id) => {
        if (!window.confirm("¿Eliminar esta categoría?")) return;
        try {
            await fetch(`http://localhost:8080/api/categories/${id}`, {
                method: "DELETE",
            });
            fetchCategories();
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    const moveCategory = async (index, direction) => {
        const newOrder = [...categories];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= newOrder.length) return;
        [newOrder[index], newOrder[targetIndex]] = [
            newOrder[targetIndex],
            newOrder[index],
        ];

        for (let i = 0; i < newOrder.length; i++) {
            newOrder[i].order = i;
            await fetch(`http://localhost:8080/api/categories/${newOrder[i]._id}/reorder`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ order: i }),
            });
        }

        setCategories([...newOrder]);
    };

    const handleCreateProduct = async () => {
        const formData = new FormData();

        formData.append("name", newProduct.name);
        formData.append("price", newProduct.price);
        formData.append("category", newProduct.category);
        formData.append("description", newProduct.description);
        formData.append("hasSizes", newProduct.hasSizes ? "true" : "false"); // 👈 importante

        // 👕 Si tiene tallas, enviar tallas
        if (newProduct.hasSizes) {
            formData.append("sizes", JSON.stringify(newProduct.sizes));
        } else {
            // 📦 Si no tiene tallas, enviar stock
            formData.append("stock", newProduct.stock);
        }

        // Imágenes
        formData.append("coverImage", newProduct.coverImage);
        formData.append("hoverImage", newProduct.hoverImage);
        newProduct.images.forEach((img, i) => {
            formData.append("images", img);
        });

        try {
            const res = await fetch("http://localhost:8080/api/products", {
                method: "POST",
                credentials: "include",
                body: formData,
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = await res.json();

            if (res.ok) {
                alert("✅ Producto creado exitosamente");
                // Limpieza opcional:
                setNewProduct({
                    name: "",
                    price: "",
                    category: "",
                    description: "",
                    hasSizes: true,
                    sizes: { S: 0, M: 0, L: 0, XL: 0 },
                    stock: 0,
                    coverImage: null,
                    hoverImage: null,
                    images: []
                });
            } else {
                alert(`❌ Error: ${data.message}`);
            }
        } catch (err) {
            console.error("❌ Error creando el producto:", err);
            alert("Ocurrió un error al crear el producto.");
        }
    };

    const handleEditProduct = async () => {
        if (!editingProduct) return;

        try {
            const discount = editingProduct.discount !== "" && !isNaN(editingProduct.discount)
                ? parseFloat(editingProduct.discount)
                : 0;
            const originalPrice = editingProduct.originalPrice !== ""
                ? parseFloat(editingProduct.originalPrice)
                : parseFloat(editingProduct.price);
            const userPrice = parseFloat(editingProduct.price);

            const validDiscount = isNaN(discount) ? 0 : discount;
            const validOriginal = isNaN(originalPrice) ? userPrice : originalPrice;

            let finalPrice = userPrice;
            let finalOriginal = validOriginal;

            if (validDiscount > 0) {
                finalPrice = (validOriginal * (1 - validDiscount / 100)).toFixed(2);
            } else {
                finalOriginal = userPrice;
            }

            const formData = new FormData();
            formData.append("name", editingProduct.name);
            formData.append("price", finalPrice);
            formData.append("description", editingProduct.description);
            formData.append("discount", validDiscount);
            formData.append("originalPrice", finalOriginal);

            // Tallas
            Object.entries(editingProduct.sizes).forEach(([size, value]) => {
                formData.append(`sizes[${size}]`, value);
            });

            // Archivos (si se modificaron)
            if (editingProduct.newCoverImage) {
                formData.append("coverImage", editingProduct.newCoverImage);
            }
            if (editingProduct.newHoverImage) {
                formData.append("hoverImage", editingProduct.newHoverImage);
            }
            if (editingProduct.newImages && editingProduct.newImages.length > 0) {
                editingProduct.newImages.forEach((file, i) => {
                    formData.append("images", file); // importante que sea "images" sin [i] si estás usando multer.array
                });
            }

            const res = await fetch(`http://localhost:8080/api/products/${editingProduct._id}`, {
                method: "PUT",
                credentials: "include",
                body: formData
            });

            if (res.ok) {
                fetchProducts();
                alert("✅ Producto actualizado exitosamente!");
                setEditingProduct(null);
                setShowEditModal(false);
            } else {
                alert("❌ Error al actualizar el producto");
            }
        } catch (error) {
            console.error("❌ Error updating product:", error);
            alert("❌ Error al actualizar producto");
        }
    };




    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;

        try {
            const res = await fetch(`http://localhost:8080/api/products/${id}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (res.ok) {
                alert("✅ Product deleted successfully!");
                fetchProducts();
            } else {
                const errorData = await res.json();
                alert(`❌ Error: ${errorData.message || "Failed to delete product"}`);
            }
        } catch (error) {
            console.error("❌ Error deleting product:", error);
            alert("❌ Failed to delete product");
        }
    };

    const getAvailabilityStatus = (product) => {
        if (product.hasSizes) {
            const totalSizes = Object.values(product.sizes || {}).reduce((acc, val) => acc + Number(val || 0), 0);
            return totalSizes > 0 ? "Available" : "Not Available";
        } else {
            return product.stock > 0 ? `Stock: ${product.stock}` : "Out of Stock";
        }
    };

    const [allOrders, setAllOrders] = useState([]);
    const [archivedOrders, setArchivedOrders] = useState([]);
    const [showArchivedModal, setShowArchivedModal] = useState(false);


    useEffect(() => {
        fetchAllOrders();
    }, []);

    const fetchAllOrders = async () => {
        const res = await fetch("http://localhost:8080/api/orders", {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const activeOrders = data.filter(order => !order.archived);
        setAllOrders(activeOrders);
    };

    const updateOrderStatus = async (orderId, status) => {
        const res = await fetch(`http://localhost:8080/api/orders/${orderId}/status`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });

        if (res.ok) fetchAllOrders();
    };

    const [orders, setOrders] = useState([]);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await fetch("http://localhost:8080/api/orders", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setOrders(data);
        } catch (error) {
            console.error("Error al obtener órdenes:", error);
        }
    };

    // const deleteOrder = async (orderId) => {
    //     if (!window.confirm("¿Estás seguro de que quieres eliminar esta orden?")) return;

    //     try {
    //         const res = await fetch(`http://localhost:8080/api/orders/${orderId}`, {
    //             method: "DELETE",
    //             headers: {
    //                 Authorization: `Bearer ${token}`,
    //             },
    //         });

    //         if (res.ok) {
    //             alert("✅ Orden eliminada correctamente");
    //             setAllOrders(prev => prev.filter(order => order._id !== orderId)); // actualiza UI
    //         } else {
    //             alert("❌ Error al eliminar la orden");
    //         }
    //     } catch (error) {
    //         console.error("❌ Error al eliminar orden:", error);
    //         alert("❌ Falló la eliminación de la orden");
    //     }
    // };

    const archiveOrder = async (orderId) => {
        try {
            const res = await fetch(`http://localhost:8080/api/orders/${orderId}/archive`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ archived: true })
            });

            if (res.ok) {
                alert("✅ Orden archivada");
                fetchAllOrders(); // refresca la tabla sin esa orden
            } else {
                alert("❌ Error al archivar la orden");
            }
        } catch (error) {
            console.error("❌ Error al archivar:", error);
            alert("❌ Fallo al archivar la orden");
        }
    };

    const fetchArchivedOrders = async () => {
        try {
            const res = await fetch("http://localhost:8080/api/orders/archived", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();

            if (Array.isArray(data)) {
                setArchivedOrders(data);
            } else {
                console.error("⚠️ La respuesta no es un array:", data);
                setArchivedOrders([]);
            }
        } catch (error) {
            console.error("❌ Error al obtener órdenes archivadas:", error);
            setArchivedOrders([]);
        }
    };



    return (
        <div className="p-6  mx-auto pt-24 min-h-screen w-full  bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-white">

            {/* Add New Product Form */}
            <motion.div
                className="mb-12 p-8 rounded-2xl shadow-2xl bg-zinc-900 border border-zinc-700 text-white"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                <h2 className="text-3xl font-bold mb-6 text-center text-fuchsia-500 uppercase tracking-wider">
                    Añadir Productos Nuevos
                </h2>

                <div className="flex flex-wrap gap-6">
                    {/* Nombre */}
                    <div className="flex flex-col w-full md:w-[48%]">
                        <label className="text-sm mb-1 text-gray-300 font-medium">Nombre del Producto</label>
                        <input
                            className="bg-zinc-800 border border-zinc-600 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                            type="text"
                            placeholder="Ej: Camisa Oversize"
                            value={newProduct.name}
                            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        />
                    </div>

                    {/* Precio */}
                    <div className="flex flex-col w-full md:w-[48%]">
                        <label className="text-sm mb-1 text-gray-300 font-medium">Precio ($)</label>
                        <input
                            className="bg-zinc-800 border border-zinc-600 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                            type="number"
                            placeholder="Ej: 29.99"
                            value={newProduct.price}
                            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                        />
                    </div>

                    {/* Categoría */}
                    <div className="flex flex-col w-full md:w-[48%]">
                        <label className="text-sm mb-1 text-gray-300 font-medium">Categoría</label>
                        <select
                            className="bg-zinc-800 border border-zinc-600 p-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                            value={newProduct.category}
                            onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                        >
                            {categories.map((cat) => (
                                <option key={cat._id} value={cat.name}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Descripción */}
                    <div className="flex flex-col w-full">
                        <label className="text-sm mb-1 text-gray-300 font-medium">Descripción</label>
                        <textarea
                            className="bg-zinc-800 border border-zinc-600 p-3 rounded-lg min-h-[100px] focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                            placeholder="Escribe una breve descripción del producto..."
                            value={newProduct.description}
                            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                        />
                    </div>

                    {/* Tallas */}

                    <div className="flex items-center gap-2 mt-4">
                        <input
                            type="checkbox"
                            checked={newProduct.hasSizes}
                            onChange={(e) =>
                                setNewProduct({ ...newProduct, hasSizes: e.target.checked })
                            }
                            className="w-4 h-4"
                        />
                        <label className="text-gray-300 text-sm">Este producto tiene tallas</label>
                    </div>

                    {newProduct.hasSizes ? (
                        <div className="w-full flex flex-wrap gap-4 mt-2">
                            {["S", "M", "L", "XL"].map((size) => (
                                <div key={size} className="flex flex-col w-[48%] md:w-[23%]">
                                    <label className="text-sm text-gray-300 mb-1">{size}</label>
                                    <input
                                        type="number"
                                        className="bg-zinc-800 border border-zinc-600 p-2 rounded-lg"
                                        value={newProduct.sizes[size] || 0}
                                        onChange={(e) =>
                                            setNewProduct({
                                                ...newProduct,
                                                sizes: { ...newProduct.sizes, [size]: e.target.value || 0 }
                                            })
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col w-full md:w-[48%] mt-4">
                            <label className="text-sm mb-1 text-gray-300 font-medium">Stock</label>
                            <input
                                type="number"
                                placeholder="Ej: 50"
                                className="bg-zinc-800 border border-zinc-600 p-3 rounded-lg"
                                value={newProduct.stock}
                                onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                            />
                        </div>
                    )}


                    {/* Imágenes */}
                    <div className="flex flex-col w-full md:w-[48%] mt-4">
                        <label className="text-sm mb-1 text-gray-300 font-medium">Cover Image</label>
                        <input
                            type="file"
                            accept="image/*"
                            className="bg-zinc-800 text-gray-300 p-3 rounded-lg border border-zinc-600"
                            onChange={(e) =>
                                setNewProduct({ ...newProduct, coverImage: e.target.files[0] })
                            }
                        />
                    </div>

                    <div className="flex flex-col w-full md:w-[48%] mt-4">
                        <label className="text-sm mb-1 text-gray-300 font-medium">Hover Image</label>
                        <input
                            type="file"
                            accept="image/*"
                            className="bg-zinc-800 text-gray-300 p-3 rounded-lg border border-zinc-600"
                            onChange={(e) =>
                                setNewProduct({ ...newProduct, hoverImage: e.target.files[0] })
                            }
                        />
                    </div>

                    {/* Imágenes adicionales */}
                    <div className="flex flex-col w-full mt-4">
                        <label className="text-sm mb-1 text-gray-300 font-medium">
                            Imágenes Adicionales (Máx. 4)
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            className="bg-zinc-800 text-gray-300 p-3 rounded-lg border border-zinc-600"
                            onChange={(e) => {
                                const files = Array.from(e.target.files);
                                const totalImages = newProduct.images.length + files.length;
                                if (totalImages > 4) {
                                    alert("Máximo 4 imágenes adicionales");
                                    return;
                                }
                                setNewProduct({ ...newProduct, images: [...newProduct.images, ...files] });
                            }}
                        />

                        {/* Vista previa */}
                        {newProduct.images.length > 0 && (
                            <div className="flex flex-wrap gap-4 mt-3">
                                {newProduct.images.map((file, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={`Preview ${index + 1}`}
                                            className="w-20 h-20 object-cover rounded border border-zinc-700"
                                        />
                                        <button
                                            onClick={() =>
                                                setNewProduct({
                                                    ...newProduct,
                                                    images: newProduct.images.filter((_, i) => i !== index),
                                                })
                                            }
                                            className="absolute top-0 right-0 bg-red-600 text-white text-xs rounded-full px-1"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Botón */}
                <div className="flex justify-center mt-8">
                    <button
                        className="bg-fuchsia-600 text-white px-8 py-3 rounded-full hover:bg-fuchsia-700 transition duration-300 shadow-md"
                        onClick={handleCreateProduct}
                    >
                        Crear Producto
                    </button>
                </div>
            </motion.div>




            {/* PRODUCT TABLE */}
            <div className="p-6 max-w-7xl mx-auto pt-20 text-white">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {loading ? (
                        <p className="text-center text-gray-400">Cargando productos...</p>
                    ) : error ? (
                        <p className="text-red-500 text-center">Error: {error}</p>
                    ) : (
                        <div className="overflow-x-auto rounded-xl shadow-xl border border-zinc-700 bg-zinc-900">
                            <table className="min-w-full text-sm text-left">
                                <thead className="bg-zinc-800 text-fuchsia-400 uppercase tracking-wide text-xs">
                                    <tr>
                                        <th className="px-6 py-4">Imagen</th>
                                        <th className="px-6 py-4">Nombre</th>
                                        <th className="px-6 py-4">Precio</th>
                                        <th className="px-6 py-4">Inventario</th>
                                        <th className="px-6 py-4">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((product) => (
                                        <tr key={product._id} className="border-t border-zinc-700 hover:bg-zinc-800 transition-all">
                                            <td className="px-6 py-4">
                                                <img
                                                    src={product.coverImage}
                                                    alt={product.name}
                                                    className="w-16 h-16 object-cover rounded shadow"
                                                />
                                            </td>
                                            <td className="px-6 py-4 font-medium">{product.name}</td>
                                            <td className="px-6 py-4 text-fuchsia-400 font-semibold">${product.price}</td>
                                            <td className="px-6 py-4">{getAvailabilityStatus(product)}</td>
                                            <td className="px-6 py-4 flex flex-wrap gap-2">
                                                <button
                                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                                                    onClick={() => {
                                                        setEditingProduct(product);
                                                        setShowEditModal(true);
                                                    }}
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
                                                    onClick={() => handleDelete(product._id)}
                                                >
                                                    Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>

                {/* MODAL DE EDICIÓN */}
                {showEditModal && editingProduct && (
                    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 sm:px-6">
                        <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-700 text-white p-8 sm:p-10 rounded-3xl shadow-2xl overflow-y-auto max-h-[95vh] space-y-6">
                            <h2 className="text-3xl font-bold text-fuchsia-400 text-center mb-4">Editar Producto</h2>

                            {/* Imagen principal */}
                            <div className="space-y-1">
                                <label className="text-sm text-gray-300">Imagen Principal (Cover)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setEditingProduct({ ...editingProduct, newCoverImage: e.target.files[0] })}
                                    className="block w-full text-sm text-gray-300 file:bg-fuchsia-600 file:border-none file:px-4 file:py-2 file:rounded file:text-white file:cursor-pointer"
                                />
                            </div>

                            {/* Hover image */}
                            <div className="space-y-1">
                                <label className="text-sm text-gray-300">Imagen Hover</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setEditingProduct({ ...editingProduct, newHoverImage: e.target.files[0] })}
                                    className="block w-full text-sm text-gray-300 file:bg-fuchsia-600 file:border-none file:px-4 file:py-2 file:rounded file:text-white file:cursor-pointer"
                                />
                            </div>

                            {/* Adicionales */}
                            <div className="space-y-1">
                                <label className="text-sm text-gray-300">Imágenes Adicionales</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => setEditingProduct({ ...editingProduct, newImages: [...e.target.files] })}
                                    className="block w-full text-sm text-gray-300 file:bg-fuchsia-600 file:border-none file:px-4 file:py-2 file:rounded file:text-white file:cursor-pointer"
                                />
                            </div>

                            {/* Nombre */}
                            <div>
                                <label className="text-sm text-gray-300">Nombre</label>
                                <input
                                    className="w-full bg-zinc-800 border border-zinc-600 p-3 rounded mt-1"
                                    type="text"
                                    value={editingProduct.name}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                />
                            </div>

                            {/* Precio y Descuento */}
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-300">Precio</label>
                                    <input
                                        className="w-full bg-zinc-800 border border-zinc-600 p-3 rounded mt-1"
                                        type="number"
                                        value={editingProduct.price}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-gray-300">Precio Original</label>
                                    <input
                                        className="w-full bg-zinc-800 border border-zinc-600 p-3 rounded mt-1"
                                        type="number"
                                        value={editingProduct.originalPrice || ""}
                                        onChange={(e) => {
                                            const original = parseFloat(e.target.value);
                                            const discount = parseFloat(editingProduct.discount || 0);
                                            const discounted = original * (1 - discount / 100);
                                            setEditingProduct((prev) => ({
                                                ...prev,
                                                originalPrice: original,
                                                price: discounted.toFixed(2),
                                            }));
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Descuento */}
                            <div>
                                <label className="text-sm text-gray-300">Descuento (%)</label>
                                <input
                                    className="w-full bg-zinc-800 border border-zinc-600 p-3 rounded mt-1"
                                    type="number"
                                    value={editingProduct.discount || ""}
                                    onChange={(e) => {
                                        const discount = parseFloat(e.target.value);
                                        const original = parseFloat(editingProduct.originalPrice || 0);
                                        const discounted = original * (1 - (discount || 0) / 100);
                                        setEditingProduct((prev) => ({
                                            ...prev,
                                            discount: discount || 0,
                                            price: discounted.toFixed(2),
                                        }));
                                    }}
                                />
                            </div>

                            {/* Descripción */}
                            <div>
                                <label className="text-sm text-gray-300">Descripción</label>
                                <textarea
                                    className="w-full bg-zinc-800 border border-zinc-600 p-3 rounded mt-1 resize-none"
                                    rows="4"
                                    value={editingProduct.description}
                                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                                />
                            </div>

                            {/* Tallas */}
                            <div>
                                <label className="text-sm text-gray-300">Tallas</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                                    {["S", "M", "L", "XL"].map((size) => (
                                        <div key={size} className="flex flex-col">
                                            <span className="text-xs text-gray-400 mb-1">{size}</span>
                                            <input
                                                type="number"
                                                className="bg-zinc-800 border border-zinc-600 p-2 rounded"
                                                value={editingProduct.sizes[size] || 0}
                                                onChange={(e) =>
                                                    setEditingProduct({
                                                        ...editingProduct,
                                                        sizes: { ...editingProduct.sizes, [size]: e.target.value },
                                                    })
                                                }
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Botones */}
                            <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
                                <button
                                    className="bg-green-600 w-full sm:w-auto px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                                    onClick={handleEditProduct}
                                >
                                    Guardar
                                </button>
                                <button
                                    className="bg-gray-600 w-full sm:w-auto px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
                                    onClick={() => setShowEditModal(false)}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>

                )}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mt-16 text-white max-w-7xl mx-auto"
            >
                <h2 className="text-3xl font-bold text-fuchsia-400 mb-6">Gestionar Categorías</h2>

                {/* Lista de Categorías */}
                <div className="grid gap-6">
                    {categories.map((cat, index) => (
                        <div
                            key={cat._id}
                            className="bg-zinc-800 border border-zinc-700 rounded-xl p-6 shadow-lg flex flex-col md:flex-row md:items-center gap-6"
                        >
                            {/* Input Nombre */}
                            <input
                                type="text"
                                value={cat.name}
                                onChange={(e) => renameCategory(cat._id, e.target.value)}
                                className="bg-zinc-700 border border-zinc-600 p-2 rounded w-full md:w-1/4 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                                placeholder="Nombre categoría"
                            />

                            {/* Input Imagen */}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => updateCategoryImage(cat._id, e.target.files[0])}
                                className="text-sm w-full md:w-1/3 bg-zinc-900 border border-zinc-600 rounded p-2"
                            />

                            {/* Imagen preview */}
                            {cat.imageUrl && (
                                <img
                                    src={cat.imageUrl}
                                    alt={cat.name}
                                    className="w-20 h-20 object-cover rounded-lg border border-zinc-700 shadow-md"
                                />
                            )}

                            {/* Botones */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => moveCategory(index, -1)}
                                    className="bg-zinc-700 text-white px-3 py-1 rounded hover:bg-zinc-600"
                                    title="Subir"
                                >
                                    ⬆
                                </button>
                                <button
                                    onClick={() => moveCategory(index, 1)}
                                    className="bg-zinc-700 text-white px-3 py-1 rounded hover:bg-zinc-600"
                                    title="Bajar"
                                >
                                    ⬇
                                </button>
                                <button
                                    onClick={() => deleteCategory(cat._id)}
                                    className="bg-red-600 px-3 py-1 rounded text-white hover:bg-red-700"
                                    title="Eliminar"
                                >
                                    🗑
                                </button>
                            </div>


                        </div>
                    ))}
                </div>

                {/* Añadir Nueva Categoría */}
                <div className="mt-10 bg-zinc-800 border border-zinc-700 p-6 rounded-xl shadow-lg flex flex-col md:flex-row items-center gap-4">
                    <input
                        type="text"
                        placeholder="Nombre nueva categoría"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full md:w-1/3 bg-zinc-700 border border-zinc-600 p-2 rounded text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                    />

                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setNewCategoryImage(e.target.files[0])}
                        className="w-full md:w-1/3 bg-zinc-900 border border-zinc-600 p-2 rounded text-sm text-white"
                    />

                    <button
                        onClick={createCategory}
                        className="w-full md:w-auto px-6 py-2 bg-fuchsia-500 hover:bg-fuchsia-600 text-white font-semibold rounded transition"
                    >
                        Agregar
                    </button>
                </div>
            </motion.div>

            {/* Tracking order table  */}
            <div className="mt-12">
                {/* ✅ Título y botón separados del table */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-fuchsia-500 tracking-wide uppercase">
                        Órdenes Recientes
                    </h2>

                    <button
                        onClick={() => {
                            fetchArchivedOrders();
                            setShowArchivedModal(true);
                        }}
                        className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-sm px-4 py-2 rounded-full shadow"
                    >
                        Ver órdenes archivadas
                    </button>
                </div>

                {/* ✅ Tabla de órdenes */}
                <div className="overflow-x-auto rounded-xl shadow-xl border border-zinc-700">
                    <table className="min-w-full bg-zinc-900 text-sm text-left text-white rounded-xl">
                        <thead className="bg-zinc-800 text-fuchsia-400 uppercase text-xs tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Cliente</th>
                                <th className="px-6 py-4">Total</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4">Acción</th>
                                <th className="px-6 py-4">Eliminar</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-zinc-700">
                            {allOrders.map((order) => (
                                <tr
                                    key={order._id}
                                    className="hover:bg-zinc-800/60 transition duration-200"
                                    onClick={() => {
                                        setSelectedOrder(order);
                                        setShowOrderModal(true);
                                    }}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                                        {order.user?.name || (
                                            <span className="italic text-gray-400">Invitado</span>
                                        )}
                                    </td>

                                    <td className="px-6 py-4 font-semibold text-fuchsia-300">
                                        ${order.total.toFixed(2)}
                                    </td>

                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-3 py-1 text-xs font-bold rounded-full 
                ${order.status === "Paid" ? "bg-blue-600/20 text-blue-400" : ""}
                ${order.status === "En camino" ? "bg-yellow-600/20 text-yellow-400" : ""}
                ${order.status === "Entregada" ? "bg-green-600/20 text-green-400" : ""}`}
                                        >
                                            {order.status}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4">
                                        <select
                                            value={order.status}
                                            onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                                            className="bg-zinc-700 border border-zinc-600 text-white px-3 py-1 text-sm rounded focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                                        >
                                            <option value="Paid">Pagado</option>
                                            <option value="En camino">En camino</option>
                                            <option value="Entregada">Entregada</option>
                                        </select>
                                    </td>

                                    <td className="px-6 py-4">
                                        {order.status === "Entregada" && (
                                            <button
                                                onClick={() => archiveOrder(order._id)}
                                                className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs px-4 py-1 rounded-full shadow-sm transition"
                                            >
                                                Archivar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* ✅ Modal de Detalles */}
                {showOrderModal && selectedOrder && (
                    <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center">
                        <div className="bg-zinc-900 text-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto relative">
                            <button
                                onClick={() => setShowOrderModal(false)}
                                className="absolute top-3 right-3 text-gray-400 hover:text-white"
                            >
                                <FaTimes />
                            </button>
                            <h2 className="text-xl font-bold mb-4 text-fuchsia-400">Detalles de la Orden</h2>
                            <div className="space-y-4">
                                {selectedOrder.products.map((item, idx) => (
                                    <div key={idx} className="bg-zinc-800 p-4 rounded-lg flex gap-4 shadow">
                                        <img
                                            src={item.product?.coverImage || "/default.png"}
                                            alt={item.product?.name}
                                            className="w-14 h-14 object-cover rounded border border-fuchsia-500"
                                        />
                                        <div>
                                            <p className="font-semibold">{item.product?.name || 'Producto eliminado'}</p>
                                            <p className="text-sm text-gray-400">Cantidad: {item.quantity}</p>
                                            {item.size && <p className="text-sm text-gray-400">Talla: {item.size}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ✅ Modal de órdenes archivadas */}
                {showArchivedModal && (
                    <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center">
                        <div className="bg-zinc-900 text-white rounded-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto relative">
                            <button
                                onClick={() => setShowArchivedModal(false)}
                                className="absolute top-3 right-3 text-gray-400 hover:text-white"
                            >
                                <FaTimes />
                            </button>
                            <h2 className="text-xl font-bold mb-6 text-fuchsia-400">Órdenes Archivadas</h2>

                            {archivedOrders.length === 0 ? (
                                <p className="text-gray-400 italic">No hay órdenes archivadas aún.</p>
                            ) : (
                                <div className="space-y-4">
                                    {archivedOrders.map((order) => (
                                        <div
                                            key={order._id}
                                            className="bg-zinc-800 p-4 rounded-lg shadow border border-zinc-700"
                                        >
                                            <p className="text-sm font-semibold text-white">
                                                Cliente: {order.user?.name || "Invitado"}
                                            </p>
                                            <p className="text-sm text-gray-400">Total: ${order.total.toFixed(2)}</p>
                                            <p className="text-sm text-gray-500">Estado: {order.status}</p>
                                            <div className="mt-2 space-y-2">
                                                {order.products.map((item, idx) => (
                                                    <div key={idx} className="flex items-center gap-4">
                                                        <img
                                                            src={item.product?.coverImage || "/default.png"}
                                                            alt={item.product?.name}
                                                            className="w-10 h-10 object-cover rounded border border-fuchsia-500"
                                                        />
                                                        <div>
                                                            <p className="text-sm">{item.product?.name}</p>
                                                            {item.size && <p className="text-xs text-gray-400">Talla: {item.size}</p>}
                                                            <p className="text-xs text-gray-500">Cantidad: {item.quantity}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>





        </div>

    );
};


export default AdminDashboard;



