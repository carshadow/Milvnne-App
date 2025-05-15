// import Category from '../models/Category.js';
// import fs from 'fs';
// import path from 'path';

// // 🟢 Crear categoría
// export const createCategory = async (req, res) => {
//     try {
//         const { name } = req.body;

//         if (!name) return res.status(400).json({ message: "Nombre requerido" });

//         // Calcular orden automáticamente (última posición)
//         const count = await Category.countDocuments();
//         const newCategory = new Category({ name, order: count });

//         // Si se subió imagen
//         if (req.file) {
//             newCategory.image = `/uploads/${req.file.filename}`;
//         }

//         await newCategory.save();
//         res.status(201).json(newCategory);
//     } catch (err) {
//         res.status(500).json({ message: "Error al crear categoría", error: err.message });
//     }
// };

// // 🟡 Obtener todas las categorías
// export const getCategories = async (req, res) => {
//     try {
//         const categories = await Category.find().sort({ order: 1 });
//         res.json(categories);
//     } catch (err) {
//         res.status(500).json({ message: "Error al obtener categorías", error: err.message });
//     }
// };

// // 🟠 Actualizar el nombre
// export const updateCategoryName = async (req, res) => {
//     try {
//         const { name } = req.body;
//         const category = await Category.findByIdAndUpdate(
//             req.params.id,
//             { name },
//             { new: true }
//         );
//         if (!category) return res.status(404).json({ message: "Categoría no encontrada" });
//         res.json(category);
//     } catch (err) {
//         res.status(500).json({ message: "Error al renombrar", error: err.message });
//     }
// };

// // 🔵 Actualizar imagen
// export const updateCategoryImage = async (req, res) => {
//     try {
//         const category = await Category.findById(req.params.id);
//         if (!category) return res.status(404).json({ message: "Categoría no encontrada" });

//         // Borrar imagen anterior si existe
//         if (category.image) {
//             const oldPath = path.join('uploads', path.basename(category.image));
//             if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
//         }

//         category.image = `/uploads/${req.file.filename}`;
//         await category.save();
//         res.json(category);
//     } catch (err) {
//         res.status(500).json({ message: "Error al actualizar imagen", error: err.message });
//     }
// };

// // 🔴 Eliminar categoría
// export const deleteCategory = async (req, res) => {
//     try {
//         const category = await Category.findByIdAndDelete(req.params.id);
//         if (!category) return res.status(404).json({ message: "Categoría no encontrada" });

//         // Eliminar imagen si existe
//         if (category.image) {
//             const imagePath = path.join('uploads', path.basename(category.image));
//             if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
//         }

//         res.json({ message: "Categoría eliminada correctamente" });
//     } catch (err) {
//         res.status(500).json({ message: "Error al eliminar", error: err.message });
//     }
// };


// // 🔁 Reordenar
// export const reorderCategory = async (req, res) => {
//     try {
//         const { order } = req.body;
//         const category = await Category.findByIdAndUpdate(
//             req.params.id,
//             { order },
//             { new: true }
//         );
//         res.json(category);
//     } catch (err) {
//         res.status(500).json({ message: "Error al reordenar", error: err.message });
//     }
// };
