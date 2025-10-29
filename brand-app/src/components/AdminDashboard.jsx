import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaTimes, FaArrowUp, FaArrowDown, FaTrash, FaMobileAlt, FaDesktop, FaImage } from 'react-icons/fa';
import { z } from "zod";
import { useContext } from "react";
import { AuthContext } from "../context/authContext";
import heic2any from "heic2any";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';


const AdminDashboard = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user, token } = useContext(AuthContext);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [productErrors, setProductErrors] = useState({});
    const [editingErrors, setEditingErrors] = useState({});
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
    const [newCategoryMobileImage, setNewCategoryMobileImage] = useState(null);


    const fetchProducts = async () => {
        try {
            const res = await fetch("https://clothing-backend.fly.dev/api/products", {
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
            const res = await fetch("https://clothing-backend.fly.dev/api/categories");
            const data = await res.json();
            const sorted = data.sort((a, b) => a.order - b.order);
            setCategories(sorted);
            setNewProduct(p => ({ ...p, category: p.category || (sorted[0]?.name || "") }));
        } catch (err) {
            console.error("Error fetching categories:", err);
        }
    };

    const createCategory = async () => {
        if (!newCategory || !newCategoryImage) return;

        // ✅ VALIDACIÓN desktop image
        // if (
        //     !newCategoryImage.type ||
        //     newCategoryImage.type === "image/heic" ||
        //     newCategoryImage.name?.toLowerCase().endsWith(".heic")
        // ) {
        //     alert("❌ Formato HEIC no soportado. Usa JPG o PNG.");
        //     return;
        // }

        const formData = new FormData();
        formData.append("name", newCategory);
        formData.append("image", newCategoryImage);

        try {

            const res = await fetch("https://clothing-backend.fly.dev/api/categories", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,

                },
                credentials: "include",
                body: formData,
            });

            const created = await res.json();

            if (res.ok) {
                // ✅ VALIDACIÓN mobile image
                if (newCategoryMobileImage) {
                    // if (
                    //     !newCategoryMobileImage.type ||
                    //     newCategoryMobileImage.type === "image/heic" ||
                    //     newCategoryMobileImage.name?.toLowerCase().endsWith(".heic")
                    // ) {
                    //     alert("❌ Formato HEIC no soportado en móvil. Usa JPG o PNG.");
                    //     return;
                    // }

                    const mobileForm = new FormData();
                    mobileForm.append("image", newCategoryMobileImage);

                    await fetch(`https://clothing-backend.fly.dev/api/categories/${created._id}/image-mobile`, {
                        method: "PUT",
                        headers: {
                            Authorization: `Bearer ${token}`,

                        },
                        credentials: "include",
                        body: mobileForm,
                    });
                }

                setNewCategory("");
                setNewCategoryImage(null);
                setNewCategoryMobileImage(null);
                fetchCategories();
            }
        } catch (err) {
            console.error("Error creating category:", err);
        }
    };

    const ensureJpeg = async (file) => {
        if (!file) return null;
        const name = (file.name || "").toLowerCase();
        const isHeic =
            file.type === "image/heic" ||
            file.type === "" ||                 // iOS a veces no pone el mime
            name.endsWith(".heic") ||
            name.endsWith(".heif");

        if (!isHeic) return file;

        try {
            const blob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
            return new File([blob], name.replace(/\.(heic|heif)$/i, ".jpg"), { type: "image/jpeg" });
        } catch (err) {
            console.error("Error convirtiendo HEIC:", err);
            return null;
        }
    };


    const updateCategoryImage = async (id, file) => {
        // if (
        //     !file.type ||
        //     file.type === "image/heic" ||
        //     file.name?.toLowerCase().endsWith(".heic")
        // ) {
        //     alert("❌ Formato HEIC no soportado. Usa JPG o PNG.");
        //     return;
        // }
        const formData = new FormData();
        formData.append("image", file);

        try {


            await fetch(`https://clothing-backend.fly.dev/api/categories/${id}/image`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,

                },
                credentials: "include",
                body: formData,
            });

            fetchCategories();
        } catch (err) {
            console.error("Error updating image:", err);
        }
    };

    const updateCategoryMobileImage = async (id, file) => {
        console.log("📦 Archivo recibido:", file);

        if (!file) {
            alert("❌ No se seleccionó ningún archivo.");
            return;
        }

        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        const fileName = file.name?.toLowerCase();

        // ✅ Solo validamos file.type si existe, si no nos guiamos por la extensión
        if (
            file.type && !allowedTypes.includes(file.type) &&
            !(fileName?.endsWith(".jpg") || fileName?.endsWith(".jpeg") || fileName?.endsWith(".png") || fileName?.endsWith(".webp"))
        ) {
            alert("❌ Solo se permiten imágenes JPG, PNG o WebP.");
            return;
        }

        const formData = new FormData();
        formData.append("image", file);

        try {


            // ✅ Logs para verificar tokens

            console.log("🔐 Bearer Token:", token);

            const res = await fetch(`https://clothing-backend.fly.dev/api/categories/${id}/image-mobile`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,

                    // "Origin": "https://brand-app.fly.dev" // 👈 Asegúrate que este sea tu frontend en Fly.io
                },
                credentials: "include",
                body: formData,
            });

            // ✅ Manejamos respuesta correctamente, incluso si NO es JSON
            let data = {};
            let rawText = "";

            try {
                const contentType = res.headers.get("content-type");

                if (contentType && contentType.includes("application/json")) {
                    data = await res.json();
                } else {
                    rawText = await res.text();
                    data = { message: "Respuesta no JSON del servidor", raw: rawText };
                }
            } catch (err) {
                data = { message: "No se pudo interpretar la respuesta del servidor" };
            }

            console.log("🛰 Estado de respuesta:", res.status);
            console.log("🧾 Respuesta del backend:", data);
            console.log("📄 Respuesta cruda:", rawText);

            if (res.ok) {
                fetchCategories();
            } else {
                alert(`❌ Error ${res.status}: ${data.message}`);
            }

        } catch (err) {
            console.error("❌ Error al hacer fetch a /image-mobile:", err);
            alert("❌ Error al actualizar la imagen móvil.");
        }
    };






    const renameCategory = async (id, newName) => {
        try {


            await fetch(`https://clothing-backend.fly.dev/api/categories/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",

                },
                credentials: "include",
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


            //  2. Hacer el DELETE con el token
            const res = await fetch(`https://clothing-backend.fly.dev/api/categories/${id}`, {
                method: "DELETE",
                credentials: "include",
                headers: {
                    "Authorization": `Bearer ${token}`,

                }
            });

            if (res.ok) {
                fetchCategories();
            } else {
                const errorData = await res.json();
                alert(`❌ Error al eliminar: ${errorData.message}`);
            }
        } catch (err) {
            console.error("Delete failed", err);
        }
    };


    const moveCategory = async (index, direction) => {
        const newOrder = [...categories];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= newOrder.length) return;

        // Intercambiar las posiciones
        [newOrder[index], newOrder[targetIndex]] = [
            newOrder[targetIndex],
            newOrder[index],
        ];

        try {


            // Actualizar el orden en el backend
            for (let i = 0; i < newOrder.length; i++) {
                newOrder[i].order = i;

                await fetch(`https://clothing-backend.fly.dev/api/categories/${newOrder[i]._id}/reorder`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,

                    },
                    credentials: "include",
                    body: JSON.stringify({ order: i }),
                });
            }

            // Actualizar en frontend
            setCategories([...newOrder]);
        } catch (err) {
            console.error("❌ Error moviendo categorías:", err);
            alert("❌ Error al reordenar categorías");
        }
    };







    const handleCreateProduct = async () => {
        setProductErrors({}); // Limpiar errores antes de intentar

        const formData = new FormData();
        formData.append("name", newProduct.name);
        formData.append("price", newProduct.price);
        formData.append("category", newProduct.category);
        formData.append("description", newProduct.description);
        formData.append("hasSizes", newProduct.hasSizes ? "true" : "false");

        if (newProduct.hasSizes) {
            formData.append("sizes", JSON.stringify(newProduct.sizes));
        } else {
            formData.append("stock", newProduct.stock);
        }

        formData.append("coverImage", newProduct.coverImage);
        formData.append("hoverImage", newProduct.hoverImage);
        newProduct.images.forEach((img) => {
            formData.append("images", img);
        });

        try {
            const res = await fetch("https://clothing-backend.fly.dev/api/products", {
                method: "POST",
                credentials: "include",
                body: formData,
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.errors) {
                    // ⚡ Mapeamos los errores en un objeto { field: message }
                    const fieldErrors = {};
                    data.errors.forEach(err => {
                        fieldErrors[err.path[0]] = err.message;
                    });
                    setProductErrors(fieldErrors);
                } else {
                    setProductErrors({ general: data.message || "Error al crear producto" });
                }
                return;
            }

            alert("✅ Producto creado exitosamente!");
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
            fetchProducts();
        } catch (err) {
            console.error("❌ Error creando producto:", err);
            setProductErrors({ general: "Error de red o servidor" });
        }
    };

    const editProductSchema = z.object({
        name: z.string().min(1, "El nombre es requerido"),
        price: z.coerce.number({ invalid_type_error: "El precio debe ser un número" }),
        category: z.string().min(1, "La categoría es requerida"),
        description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
        hasSizes: z.coerce.boolean(),
        stock: z.coerce.number().optional(),
        sizes: z.record(z.string(), z.coerce.number().min(0, "No puede ser menor a 0")).optional(),

    });

    const handleEditProduct = async () => {
        if (!editingProduct) return;
        setEditingErrors({});

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

            // Validar con Zod
            const validation = editProductSchema.safeParse({
                name: editingProduct.name,
                price: finalPrice,
                category: editingProduct.category || "",
                description: editingProduct.description,
                hasSizes: editingProduct.hasSizes ?? true,
                stock: editingProduct.hasSizes ? undefined : editingProduct.stock,
                sizes: editingProduct.hasSizes ? editingProduct.sizes : undefined,
            });

            if (!validation.success) {
                const fieldErrors = {};
                validation.error.errors.forEach(err => {
                    fieldErrors[err.path[0]] = err.message;
                });
                setEditingErrors(fieldErrors);
                return;
            }

            const formData = new FormData();
            formData.append("name", editingProduct.name);
            formData.append("price", finalPrice);
            formData.append("description", editingProduct.description);
            formData.append("category", editingProduct.category);
            formData.append("hasSizes", editingProduct.hasSizes ? "true" : "false");

            if (editingProduct.hasSizes) {
                formData.append("sizes", JSON.stringify(editingProduct.sizes));
            } else {
                formData.append("stock", editingProduct.stock);
            }

            formData.append("discount", validDiscount);
            formData.append("originalPrice", validOriginal);

            (editingProduct.images || []).forEach((url) => {
                formData.append("existingImages", url);
            });

            if (editingProduct.newCoverImage) {
                formData.append("coverImage", editingProduct.newCoverImage);
            }
            if (editingProduct.newHoverImage) {
                formData.append("hoverImage", editingProduct.newHoverImage);
            }
            if (editingProduct.newImages && editingProduct.newImages.length > 0) {
                editingProduct.newImages.forEach((file) => {
                    formData.append("images", file);
                });
            }



            const res = await fetch(`https://clothing-backend.fly.dev/api/products/${editingProduct._id}`, {
                method: "PUT",
                credentials: "include",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (res.ok) {
                fetchProducts();
                alert("Producto actualizado exitosamente!");
                setEditingProduct(null);
                setShowEditModal(false);
            } else {
                const data = await res.json();
                alert(`❌ Error al actualizar producto: ${data.message || "Error desconocido"}`);
            }

        } catch (error) {
            console.error("❌ Error updating product:", error);
            alert("❌ Error al actualizar producto");
        }
    };






    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;

        try {


            // ✅ 2. Enviar el DELETE con el token
            const res = await fetch(`https://clothing-backend.fly.dev/api/products/${id}`, {
                method: "DELETE",
                credentials: "include",
                headers: {
                    "Authorization": `Bearer ${token}`,

                }
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
        const res = await fetch("https://clothing-backend.fly.dev/api/orders", {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        const activeOrders = data.filter(order => !order.archived);
        setAllOrders(activeOrders);
    };

    const updateOrderStatus = async (orderId, status) => {

        const res = await fetch(`https://clothing-backend.fly.dev/api/orders/${orderId}/status`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,

            },
            credentials: "include",
            body: JSON.stringify({ status })
        });
        if (res.ok) {
            alert("📩 Estado actualizado y email enviado al cliente");
            fetchAllOrders();
        }

        if (res.ok) fetchAllOrders();
    };

    const [orders, setOrders] = useState([]);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await fetch("https://clothing-backend.fly.dev/api/orders", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setOrders(data);
        } catch (error) {
            console.error("Error al obtener órdenes:", error);
        }
    };

    const archiveOrder = async (orderId) => {
        try {



            const res = await fetch(`https://clothing-backend.fly.dev/api/orders/${orderId}/archive`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,

                },
                credentials: "include",
                body: JSON.stringify({ archived: true })
            });

            if (res.ok) {
                alert("✅ Orden archivada");
                fetchAllOrders();
            } else {
                const err = await res.json();
                alert("❌ Error al archivar: " + (err.message || "Error desconocido"));
            }

        } catch (error) {
            console.error("❌ Error al archivar:", error);
            alert("❌ Fallo al archivar la orden");
        }
    };

    const fetchArchivedOrders = async () => {
        try {
            const res = await fetch("https://clothing-backend.fly.dev/api/orders/archived", {
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
                        {productErrors.name && (
                            <p className="text-red-400 text-xs mt-1">{productErrors.name}</p>
                        )}
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
                        {productErrors.price && (
                            <p className="text-red-400 text-xs mt-1">{productErrors.price}</p>
                        )}
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
                        {productErrors.category && (
                            <p className="text-red-400 text-xs mt-1">{productErrors.category}</p>
                        )}
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
                        {productErrors.description && (
                            <p className="text-red-400 text-xs mt-1">{productErrors.description}</p>
                        )}
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
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        className="bg-zinc-800 border border-zinc-600 p-2 rounded-lg"
                                        value={newProduct.sizes[size] || ""}
                                        onChange={(e) =>
                                            setNewProduct({
                                                ...newProduct,
                                                sizes: { ...newProduct.sizes, [size]: e.target.value }
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
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const safe = await ensureJpeg(file);
                                if (!safe) return; // conversión fallida
                                setNewProduct(prev => ({ ...prev, coverImage: safe }));
                            }}
                        />

                    </div>

                    <div className="flex flex-col w-full md:w-[48%] mt-4">
                        <label className="text-sm mb-1 text-gray-300 font-medium">Hover Image</label>
                        <input
                            type="file"
                            accept="image/*"
                            className="bg-zinc-800 text-gray-300 p-3 rounded-lg border border-zinc-600"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const safe = await ensureJpeg(file);
                                if (!safe) return;
                                setNewProduct(prev => ({ ...prev, hoverImage: safe }));
                            }}
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
                            multiple
                            onChange={async (e) => {
                                const selected = Array.from(e.target.files || []);
                                if (!selected.length) return;

                                // convertir cada archivo si hace falta
                                const converted = [];
                                for (const f of selected) {
                                    const safe = await ensureJpeg(f);
                                    if (safe) converted.push(safe);
                                }

                                const total = newProduct.images.length + converted.length;
                                if (total > 4) {
                                    alert("Máximo 4 imágenes adicionales");
                                    return;
                                }

                                setNewProduct(prev => ({ ...prev, images: [...prev.images, ...converted] }));
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
                        <div className="overflow-x-auto bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl">
                            <table className="min-w-full divide-y divide-zinc-800 text-sm">
                                <thead className="bg-zinc-800 text-fuchsia-400 uppercase text-[11px] tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4 text-left">Imagen</th>
                                        <th className="px-6 py-4 text-left">Nombre</th>
                                        <th className="px-6 py-4 text-left">Precio</th>
                                        <th className="px-6 py-4 text-left">Inventario</th>
                                        <th className="px-6 py-4 text-center">Acciones</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-zinc-800">
                                    {products.map((product) => (
                                        <tr key={product._id} className="group hover:bg-zinc-800 transition">
                                            {/* Imagen */}
                                            <td className="px-6 py-5">
                                                <div className="w-16 h-16 rounded-xl overflow-hidden border border-zinc-700 shadow-md">
                                                    <img
                                                        src={product.coverImage}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                    />
                                                </div>
                                            </td>

                                            {/* Nombre */}
                                            <td className="px-6 py-5 font-semibold text-white">{product.name}</td>

                                            {/* Precio */}
                                            <td className="px-6 py-5 text-fuchsia-400 font-bold">${product.price}</td>

                                            {/* Inventario */}
                                            <td className="px-6 py-5 text-gray-300">
                                                <span
                                                    className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${getAvailabilityStatus(product) === 'Not Available'
                                                        ? 'bg-red-500/20 text-red-400'
                                                        : 'bg-green-500/20 text-green-400'
                                                        }`}
                                                >
                                                    {getAvailabilityStatus(product)}
                                                </span>
                                            </td>

                                            {/* Acciones */}
                                            <td className="px-6 py-5 text-center">
                                                <div className="flex items-center justify-center gap-3">
                                                    <button
                                                        onClick={() => {
                                                            setEditingProduct(product);
                                                            setShowEditModal(true);
                                                        }}
                                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium shadow transition"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(product._id)}
                                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-medium shadow transition"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
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
                                    className="bg-zinc-800 text-gray-300 p-3 rounded-lg border border-zinc-600"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const safe = await ensureJpeg(file);
                                        if (!safe) return;
                                        setEditingProduct(prev => ({ ...prev, newCoverImage: safe }));
                                    }}
                                />

                                {editingProduct.coverImage && (
                                    <img
                                        src={editingProduct.coverImage}
                                        alt="Cover actual"
                                        className="w-24 h-24 object-cover rounded-lg mt-2 border border-zinc-600"
                                    />
                                )}

                            </div>

                            {/* Hover image */}
                            <div className="space-y-1">
                                <label className="text-sm text-gray-300">Imagen Hover</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="bg-zinc-800 text-gray-300 p-3 rounded-lg border border-zinc-600"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const safe = await ensureJpeg(file);
                                        if (!safe) return;
                                        setEditingProduct(prev => ({ ...prev, newHoverImage: safe }));
                                    }}
                                />

                                {editingProduct.hoverImage && (
                                    <img
                                        src={editingProduct.hoverImage}
                                        alt="Hover actual"
                                        className="w-24 h-24 object-cover rounded-lg mt-2 border border-zinc-600"
                                    />
                                )}


                            </div>

                            {/* Imágenes adicionales */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">Imágenes Adicionales (máx. 4)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="bg-zinc-800 text-gray-300 p-3 rounded-lg border border-zinc-600 w-full"
                                    onChange={async (e) => {
                                        const selected = Array.from(e.target.files || []);
                                        if (!selected.length) return;

                                        const converted = [];
                                        for (const f of selected) {
                                            const safe = await ensureJpeg(f);
                                            if (safe) converted.push(safe);
                                        }

                                        const totalExisting = editingProduct.images?.length || 0;
                                        const totalNew = (editingProduct.newImages?.length || 0) + converted.length;
                                        if (totalExisting + totalNew > 4) {
                                            toast.warning("🚫 Máximo 4 imágenes adicionales permitidas en total.");
                                            return;
                                        }

                                        setEditingProduct(prev => ({
                                            ...prev,
                                            newImages: [...(prev.newImages || []), ...converted],
                                        }));
                                    }}
                                />


                                {/* Vista previa */}
                                <div className="flex flex-wrap gap-4 mt-3">
                                    {/* Imágenes actuales */}
                                    {editingProduct.images?.map((img, index) => (
                                        <div key={`old-${index}`} className="relative group">
                                            <img
                                                src={img}
                                                alt={`Actual ${index + 1}`}
                                                className="w-24 h-24 object-cover rounded border border-zinc-600 shadow-md"
                                            />
                                            <button
                                                onClick={() => {
                                                    const updated = [...editingProduct.images];
                                                    updated.splice(index, 1);
                                                    setEditingProduct({ ...editingProduct, images: updated });
                                                }}
                                                className="absolute top-1 right-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full"
                                                title="Eliminar"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}

                                    {/* Imágenes nuevas */}
                                    {editingProduct.newImages?.map((file, index) => (
                                        <div key={`new-${index}`} className="relative group">
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={`Nueva ${index + 1}`}
                                                className="w-24 h-24 object-cover rounded border border-purple-500 shadow-md"
                                            />
                                            <button
                                                onClick={() => {
                                                    const updated = [...editingProduct.newImages];
                                                    updated.splice(index, 1);
                                                    setEditingProduct({ ...editingProduct, newImages: updated });
                                                }}
                                                className="absolute top-1 right-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full"
                                                title="Eliminar"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
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
                                {editingErrors.name && (
                                    <motion.div className="text-red-500">
                                        {editingErrors.name}
                                    </motion.div>
                                )}
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
                className="mt-16 text-white max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
            >
                <h2 className="text-4xl font-extrabold text-fuchsia-400 mb-10 text-center tracking-tight">
                    Gestionar Categorías
                </h2>

                {/* Tabla de categorías */}
                <div className="rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-zinc-900 via-black to-zinc-950">
                    {/* Header */}
                    <div className="px-5 py-4 flex items-center justify-between border-b border-white/10">
                        <h3 className="text-lg font-semibold text-white tracking-tight">Categorías</h3>
                        <span className="text-xs text-gray-400">{categories?.length ?? 0} items</span>
                    </div>

                    {/* Mobile cards (sm-) */}
                    {/* Mobile cards (sm-) — versión con imágenes pequeñas apiladas */}
                    <div className="sm:hidden divide-y divide-white/5">
                        {categories.map((cat, index) => (
                            <div key={cat._id} className="p-4 space-y-5">
                                {/* Nombre */}
                                <input
                                    type="text"
                                    value={cat.name}
                                    onChange={(e) => renameCategory(cat._id, e.target.value)}
                                    className="w-full bg-zinc-900/60 ring-1 ring-white/10 focus:ring-fuchsia-500/40 outline-none text-sm text-white px-3 py-2 rounded-lg placeholder:text-gray-500"
                                    placeholder="Nombre de categoría"
                                />

                                {/* Imagen Desktop (cuadro pequeño arriba) */}
                                <div className="flex flex-col items-center">
                                    <div className="text-[11px] text-gray-300 mb-2 inline-flex items-center gap-1">
                                        <FaDesktop className="opacity-70" /> Desktop
                                    </div>
                                    <div className="w-32 h-32 rounded-xl overflow-hidden ring-1 ring-white/10">
                                        <img
                                            src={
                                                cat.imageUrl ||
                                                "https://res.cloudinary.com/dkx4n6r0v/image/upload/v1710000000/milvnne-products/default.png"
                                            }
                                            alt={`${cat.name} desktop`}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Chip Desktop */}
                                    <span
                                        className={`mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] ring-1
          ${cat.imageUrl
                                                ? "bg-emerald-600/20 text-emerald-200 ring-emerald-400/40"
                                                : "bg-zinc-800/80 text-zinc-300 ring-white/10"}`}
                                    >
                                        <FaDesktop /> {cat.imageUrl ? "Con imagen" : "Sin imagen"}
                                    </span>

                                    {/* Uploader Desktop */}
                                    <label className="block mt-3 w-full">
                                        <span className="text-[11px] text-gray-300 mb-1 inline-flex items-center gap-1">
                                            <FaImage className="opacity-70" /> Cambiar imagen (Desktop)
                                        </span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                const safe = await ensureJpeg(file);
                                                if (!safe) return;
                                                updateCategoryImage(cat._id, safe);
                                            }}
                                            className="block w-full text-xs text-gray-300 file:bg-zinc-800 file:ring-1 file:ring-white/10 file:px-3 file:py-1.5 file:rounded-md file:text-white file:cursor-pointer hover:file:bg-zinc-700 transition"
                                        />
                                    </label>
                                </div>

                                {/* Imagen Mobile (cuadro pequeño abajo) */}
                                <div className="flex flex-col items-center">
                                    <div className="text-[11px] text-white mb-2 inline-flex items-center gap-1">
                                        <FaMobileAlt className="opacity-90" /> Mobile
                                    </div>
                                    <div className="w-32 h-32 rounded-xl overflow-hidden ring-1 ring-fuchsia-400/40">
                                        <img
                                            src={
                                                cat.imageMobile ||
                                                cat.imageUrl ||
                                                "https://res.cloudinary.com/dkx4n6r0v/image/upload/v1710000000/milvnne-products/default.png"
                                            }
                                            alt={`${cat.name} mobile`}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Chip Mobile (más contraste) */}
                                    <span
                                        className={`mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] ring-1
          ${cat.imageMobile
                                                ? "bg-fuchsia-600 text-white ring-fuchsia-400/60"
                                                : "bg-zinc-800/80 text-zinc-300 ring-white/10"}`}
                                    >
                                        <FaMobileAlt /> {cat.imageMobile ? "Con imagen (Mobile)" : "Sin imagen (Mobile)"}
                                    </span>

                                    {/* Uploader Mobile */}
                                    <label className="block mt-3 w-full">
                                        <span className="text-[11px] text-white mb-1 inline-flex items-center gap-1">
                                            <FaImage className="opacity-90" /> Cambiar imagen (Mobile)
                                        </span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                const safe = await ensureJpeg(file);
                                                if (!safe) return;
                                                await updateCategoryMobileImage(cat._id, safe);
                                            }}
                                            className="block w-full text-xs text-white file:bg-fuchsia-700 file:ring-1 file:ring-fuchsia-300/60 file:px-3 file:py-1.5 file:rounded-md file:text-white file:cursor-pointer hover:file:bg-fuchsia-600 transition"
                                        />
                                    </label>

                                    <small className="text-[11px] text-gray-400 mt-2 block text-center">
                                        Opcional — sube una imagen distinta para mobile si lo necesitas.
                                    </small>
                                </div>

                                {/* Acciones */}
                                <div className="pt-3 flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => moveCategory(index, -1)}
                                        disabled={index === 0}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm bg-zinc-800 hover:bg-zinc-700 text-white ring-1 ring-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                        title="Subir"
                                    >
                                        <FaArrowUp /> Subir
                                    </button>
                                    <button
                                        onClick={() => moveCategory(index, 1)}
                                        disabled={index === categories.length - 1}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm bg-zinc-800 hover:bg-zinc-700 text-white ring-1 ring-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                        title="Bajar"
                                    >
                                        <FaArrowDown /> Bajar
                                    </button>
                                    <button
                                        onClick={() => deleteCategory(cat._id)}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm bg-red-600 hover:bg-red-700 text-white transition"
                                        title="Eliminar"
                                    >
                                        <FaTrash /> Eliminar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>



                    {/* Desktop table (sm+) */}
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="min-w-full border-separate border-spacing-y-2">
                            <thead className="sticky top-0 z-10">
                                <tr className="text-left text-[12px] tracking-wider text-gray-300 uppercase bg-zinc-900/80 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/60">
                                    <th className="p-3 rounded-l-xl">Imagen</th>
                                    <th className="p-3">Nombre</th>
                                    <th className="p-3">Cambiar Imagen</th>
                                    <th className="p-3 text-center rounded-r-xl">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map((cat, index) => (
                                    <tr key={cat._id} className="bg-zinc-800/60 hover:bg-zinc-800 transition rounded-xl">
                                        {/* Imagen preview */}
                                        <td className="p-4">
                                            <div className="flex items-center gap-4">
                                                {/* Desktop img */}
                                                <div className="relative">
                                                    <img
                                                        src={cat.imageUrl || "https://res.cloudinary.com/dkx4n6r0v/image/upload/v1710000000/milvnne-products/default.png"}
                                                        alt={`${cat.name} desktop`}
                                                        className="w-16 h-16 object-cover rounded-lg ring-1 ring-white/10"
                                                    />
                                                    <span
                                                        className={`absolute -bottom-2 left-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ring-1
                    ${cat.imageUrl ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30" : "bg-zinc-700/40 text-zinc-300 ring-white/10"}`}
                                                    >
                                                        <FaDesktop /> {cat.imageUrl ? "Desktop" : "Sin desktop"}
                                                    </span>
                                                </div>

                                                {/* Mobile img */}
                                                <div className="relative">
                                                    <img
                                                        src={cat.imageMobile || cat.imageUrl || "https://res.cloudinary.com/dkx4n6r0v/image/upload/v1710000000/milvnne-products/default.png"}
                                                        alt={`${cat.name} mobile`}
                                                        className={`w-16 h-16 object-cover rounded-lg ring-1 ${cat.imageMobile ? "ring-fuchsia-500/30" : "ring-white/10"}`}
                                                    />
                                                    <span
                                                        className={`absolute -bottom-2 left-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ring-1
                    ${cat.imageMobile ? "bg-fuchsia-500/10 text-fuchsia-300 ring-fuchsia-500/30" : "bg-zinc-700/40 text-zinc-300 ring-white/10"}`}
                                                    >
                                                        <FaMobileAlt /> {cat.imageMobile ? "Mobile" : "Sin mobile"}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Nombre editable */}
                                        <td className="p-4 align-top">
                                            <input
                                                type="text"
                                                value={cat.name}
                                                onChange={(e) => renameCategory(cat._id, e.target.value)}
                                                className="bg-zinc-900/60 ring-1 ring-white/10 focus:ring-fuchsia-500/40 outline-none text-sm text-white px-3 py-2 rounded-lg w-full"
                                            />
                                        </td>

                                        {/* Inputs de imagen */}
                                        <td className="p-4 align-top">
                                            <div className="grid grid-cols-2 gap-3 items-start">
                                                <label className="block">
                                                    <span className="text-[11px] text-gray-400 mb-1 inline-flex items-center gap-1">
                                                        <FaDesktop className="opacity-70" /> Desktop
                                                    </span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (!file) return;
                                                            const safe = await ensureJpeg(file);
                                                            if (!safe) return;
                                                            updateCategoryImage(cat._id, safe);
                                                        }}
                                                        className="block w-full text-xs text-gray-300 file:bg-zinc-800 file:ring-1 file:ring-white/10 file:px-3 file:py-1.5 file:rounded-md file:text-white file:cursor-pointer hover:file:bg-zinc-700 transition"
                                                    />
                                                </label>

                                                <label className="block">
                                                    <span className="text-[11px] text-gray-400 mb-1 inline-flex items-center gap-1">
                                                        <FaMobileAlt className="opacity-70" /> Mobile
                                                    </span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (!file) return;
                                                            const safe = await ensureJpeg(file);
                                                            if (!safe) return;
                                                            await updateCategoryMobileImage(cat._id, safe);
                                                        }}
                                                        className="block w-full text-xs text-gray-300 file:bg-zinc-800 file:ring-1 file:ring-white/10 file:px-3 file:py-1.5 file:rounded-md file:text-white file:cursor-pointer hover:file:bg-zinc-700 transition"
                                                    />
                                                </label>
                                            </div>
                                            <small className="text-[11px] text-gray-500 mt-2 inline-block">
                                                Sube una imagen distinta para mobile si lo necesitas.
                                            </small>
                                        </td>

                                        {/* Acciones */}
                                        <td className="p-4 text-center align-top">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => moveCategory(index, -1)}
                                                    disabled={index === 0}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm bg-zinc-800 hover:bg-zinc-700 text-white ring-1 ring-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                                    title="Subir"
                                                >
                                                    <FaArrowUp /> Subir
                                                </button>
                                                <button
                                                    onClick={() => moveCategory(index, 1)}
                                                    disabled={index === categories.length - 1}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm bg-zinc-800 hover:bg-zinc-700 text-white ring-1 ring-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                                    title="Bajar"
                                                >
                                                    <FaArrowDown /> Bajar
                                                </button>
                                                <button
                                                    onClick={() => deleteCategory(cat._id)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm bg-red-600 hover:bg-red-700 text-white transition"
                                                    title="Eliminar"
                                                >
                                                    <FaTrash /> Eliminar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>


                {/* Añadir nueva categoría */}
                <div className="mt-14 bg-zinc-800 border border-zinc-700 p-6 rounded-2xl shadow-xl space-y-6">
                    <h3 className="text-2xl font-bold text-fuchsia-300 text-center">Agregar Nueva Categoría</h3>

                    <div className="flex flex-col lg:flex-row gap-6">
                        <input
                            type="text"
                            placeholder="Nombre nueva categoría"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            className="w-full lg:w-1/3 bg-zinc-700 border border-zinc-600 p-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                        />




                        <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const safe = await ensureJpeg(file);   // ← te faltaba el await
                                if (!safe) return;
                                setNewCategoryImage(safe);
                            }}
                            className="w-full lg:w-1/3 text-sm file:bg-purple-600 file:border-none file:px-4 file:py-2 file:rounded-lg file:text-white file:cursor-pointer"
                        />




                        <button
                            onClick={createCategory}
                            className="px-6 py-3 bg-fuchsia-500 hover:bg-fuchsia-600 text-white font-semibold rounded-lg transition w-full lg:w-auto"
                        >
                            Agregar
                        </button>
                    </div>
                </div>
            </motion.div>


            {/* Tracking order table  */}
            <div className="mt-12">
                {/*  Título y botón separados del table */}
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

                {/*  Tabla de órdenes */}
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

                {/*  Modal de Detalles */}
                {showOrderModal && selectedOrder && (
                    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center px-4">
                        <div className="bg-gradient-to-br from-zinc-900 via-black to-zinc-950 text-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl p-8 relative border border-white/10">

                            {/* Cerrar */}
                            <button
                                onClick={() => setShowOrderModal(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-fuchsia-400 transition text-xl"
                                aria-label="Cerrar modal"
                            >
                                <FaTimes />
                            </button>

                            {/* Título */}
                            <h2 className="text-2xl font-bold mb-6 text-fuchsia-400 tracking-tight">
                                Detalles de la Orden
                            </h2>

                            {/* Info del cliente */}
                            <div className="mb-6 space-y-2 text-sm text-gray-300">
                                <p>
                                    👤 <span className="text-white font-medium">{selectedOrder.name || "Invitado"}</span>
                                </p>
                                <p>
                                    📧 <span className="text-white font-medium">{selectedOrder.email || "No provisto"}</span>
                                </p>
                                <p>
                                    📍 <span className="text-white font-medium">{selectedOrder.address || "No provista"}</span>
                                </p>
                            </div>

                            {/* Lista de productos */}
                            <div className="space-y-4">
                                {selectedOrder.products.map((item, idx) => (
                                    <div key={idx} className="bg-zinc-800 p-4 rounded-xl flex gap-4 shadow border border-white/10">
                                        <img
                                            src={item.product?.coverImage || "/default.png"}
                                            alt={item.product?.name}
                                            className="w-14 h-14 object-cover rounded border border-fuchsia-500"
                                        />
                                        <div>
                                            <p className="font-semibold">{item.product?.name || "Producto eliminado"}</p>
                                            <p className="text-sm text-gray-400">Cantidad: {item.quantity}</p>
                                            {item.size && <p className="text-sm text-gray-400">Talla: {item.size}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/*  Modal de órdenes archivadas */}
                {showArchivedModal && (
                    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center px-4">
                        <div className="bg-gradient-to-br from-zinc-900 via-black to-zinc-950 text-white rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-y-auto shadow-2xl p-8 relative border border-white/10">

                            {/* Cerrar */}
                            <button
                                onClick={() => setShowArchivedModal(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-fuchsia-400 transition text-xl"
                                aria-label="Cerrar historial"
                            >
                                <FaTimes />
                            </button>

                            {/* Título */}
                            <h2 className="text-2xl font-bold mb-6 text-fuchsia-400 tracking-tight">
                                Órdenes Archivadas
                            </h2>

                            {/* Contenido */}
                            {archivedOrders.length === 0 ? (
                                <p className="text-gray-400 italic">No hay órdenes archivadas aún.</p>
                            ) : (
                                <div className="space-y-5 divide-y divide-white/10">
                                    {archivedOrders.map((order) => (
                                        <div key={order._id} className="pt-5 space-y-2">
                                            <p className="text-sm font-semibold text-white">
                                                Cliente: {order.user?.name || "Invitado"}
                                            </p>
                                            <p className="text-sm text-fuchsia-400">Estado: {order.status}</p>
                                            <p className="text-sm text-gray-300">Total: ${order.total.toFixed(2)}</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                                {order.products.map((item, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="bg-zinc-800 p-4 rounded-xl flex items-center gap-4 border border-white/10 shadow"
                                                    >
                                                        <img
                                                            src={item.product?.coverImage || "/default.png"}
                                                            alt={item.product?.name}
                                                            className="w-14 h-14 object-cover rounded border border-fuchsia-500"
                                                        />
                                                        <div>
                                                            <p className="text-sm text-white">{item.product?.name}</p>
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



