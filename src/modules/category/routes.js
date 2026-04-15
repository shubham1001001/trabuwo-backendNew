const express = require("express");
const multer = require("multer");
const router = express.Router();
const controller = require("./controller");
const validation = require("./validation");
const asyncHandler = require("../../utils/asyncHandler");
const { authenticate } = require("../../middleware/auth");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

/**
 * @swagger
 * /api/category:
 *   get:
 *     summary: Get all categories
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               data: [
 *                 {
 *                   id: 1,
 *                   name: "Electronics",
 *                   description: "Electronic devices",
 *                   parentId: null,
 *                   isVisible: true,
 *                   isDeleted: false
 *                 }
 *               ]
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get("/", asyncHandler(controller.getAllCategories));

/**
 * @swagger
 * /api/category/{categoryId}/children-or-siblings:
 *   get:
 *     summary: Get category children or siblings (leaf nodes only)
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     description: Returns all leaf descendant categories if the category has children, otherwise returns leaf sibling categories (categories at the same level that have no children).
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Category children or siblings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "Category children or siblings retrieved successfully"
 *               data: [
 *                 {
 *                   id: 2,
 *                   publicId: "019a876e-35d0-7497-853e-2f26e505c6b5",
 *                   name: "Smartphones",
 *                   slug: "smartphones",
 *                   parentId: 1,
 *                   isVisible: true,
 *                   isDeleted: false
 *                 }
 *               ]
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  "/:categoryId/children-or-siblings",
  validation.getCategoryChildrenOrSiblingsValidation,
  asyncHandler(controller.getCategoryChildrenOrSiblings)
);

/**
 * @swagger
 * /api/category/leaves:
 *   get:
 *     summary: Get categories with parentId = 769 and their leaf node children for mobile
 *     tags: [Category]
 *     responses:
 *       200:
 *         description: Categories with leaf node children retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "Leaf categories retrieved successfully"
 *               data: [
 *                 {
 *                   id: 1087,
 *                   publicId: "019a876e-35d0-7497-853e-2f26e505c6b4",
 *                   name: "Electronics",
 *                   slug: "electronics",
 *                   parentId: 769,
 *                   breadCrumb: "All > Electronics",
 *                   children: [
 *                     {
 *                       id: 1088,
 *                       publicId: "019a876e-35d0-7497-853e-2f26e505c6b5",
 *                       name: "Smartphones",
 *                       slug: "smartphones",
 *                       parentId: 1087,
 *                       breadCrumb: "All > Electronics > Smartphones",
 *                       children: []
 *                     }
 *                   ]
 *                 }
 *               ]
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get("/leaves", asyncHandler(controller.getLeafCategories));

/**
 * @swagger
 * /api/category/tree:
 *   get:
 *     summary: Get category tree structure
 *     tags: [Category]
 *     responses:
 *       200:
 *         description: Category tree retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "Category tree fetched"
 *               data: [
 *                 {
 *                   id: 1,
 *                   name: "Electronics",
 *                   children: [
 *                     {
 *                       id: 2,
 *                       name: "Smartphones",
 *                       children: []
 *                     }
 *                   ]
 *                 }
 *               ]
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get("/tree", asyncHandler(controller.getCategoryTree));

/**
 * @swagger
 * /api/category/mobile-home:
 *   get:
 *     summary: Get mobile home category tree with "All" as first category
 *     tags: [Category]
 *     description: Returns category tree for mobile home. The first top-level category is "All" (replacing Trending), and its children include subcategories from all categories except Trending. Leaf categories remain nested under each subcategory.
 *     responses:
 *       200:
 *         description: Mobile home category tree retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "Mobile home category tree retrieved successfully"
 *               data: [
 *                 {
 *                   id: 769,
 *                   publicId: "019a876e-35d0-7497-853e-2f26e505c6b4",
 *                   name: "All",
 *                   slug: "all",
 *                   parentId: null,
 *                   children: [
 *                     {
 *                       id: 1087,
 *                       name: "Electronics",
 *                       children: [
 *                         {
 *                           id: 1088,
 *                           name: "Smartphones",
 *                           children: []
 *                         }
 *                       ]
 *                     }
 *                   ]
 *                 }
 *               ]
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get("/mobile-home", asyncHandler(controller.getMobileHomeCategoryTree));

/**
 * @swagger
 * /api/category/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Category]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *       404:
 *         description: Category not found
 */
router.get(
  "/:id",
  validation.getCategoryByIdValidation,
  asyncHandler(controller.getCategoryById)
);

// Apply authentication and seller role requirement to all routes below
router.use(authenticate);

/**
 * @swagger
 * /api/category:
 *   post:
 *     summary: Create a new category
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the category
 *                 example: "Electronics"
 *               parentId:
 *                 type: integer
 *                 description: ID of the parent category (optional)
 *                 example: 1
 *               isVisible:
 *                 type: boolean
 *                 description: Visibility status of the category (optional)
 *                 example: true
 *               showOnWeb:
 *                 type: boolean
 *                 description: Show category on web (optional)
 *                 example: false
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "Category created"
 *               data:
 *                 id: 1
 *                 name: "Electronics"
 *                 description: "Electronic devices and gadgets"
 *                 parentId: null
 *                 isVisible: true
 *                 isDeleted: false
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post(
  "/",
  upload.single("image"),
  validation.createCategoryValidation,
  asyncHandler(controller.createCategory)
);


/**
 * @swagger
 * /api/category/search:
 *   get:
 *     summary: Search categories with chain
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *         description: Search term for category names
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: integer
 *         description: Filter by parent category ID
 *       - in: query
 *         name: isVisible
 *         schema:
 *           type: boolean
 *         description: Filter by visibility status
 *       - in: query
 *         name: isDeleted
 *         schema:
 *           type: boolean
 *         description: Filter by deletion status
 *     responses:
 *       200:
 *         description: Categories search completed successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  "/search",
  validation.searchCategoriesValidation,
  asyncHandler(controller.searchCategoriesWithChain)
);

/**
 * @swagger
 * /api/category/search-filters:
 *   get:
 *     summary: Search categories and get filters for the most likely match
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: searchTerm
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term for category names
 *     responses:
 *       200:
 *         description: Category filters retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "Category filters retrieved successfully"
 *               data:
 *                 category:
 *                   id: 1
 *                   name: "Electronics"
 *                   chain: ["All", "Electronics"]
 *                   departmentId: 1
 *                 filters:
 *                   productFilters:
 *                     - fieldName: "brand"
 *                       fieldType: "select"
 *                       label: "Brand"
 *                       options: ["Apple", "Samsung", "Sony"]
 *                       section: "basicDetails"
 *                   variantFilters:
 *                     - fieldName: "size"
 *                       fieldType: "select"
 *                       label: "Size"
 *                       options: ["S", "M", "L", "XL"]
 *                       section: "addVariant"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  "/search-filters",
  validation.searchCategoryFiltersValidation,
  asyncHandler(controller.searchCategoryFilters)
);

/**
 * @swagger
 * /api/category/last-used:
 *   get:
 *     summary: Get last used uploaded catalogue's category with chain for the user
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Last used category with chain fetched successfully
 *       404:
 *         description: No last used category found for user
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get("/last-used", asyncHandler(controller.lastUsedCategoryWithChain));

/**
 * @swagger
 * /api/category/{id}:
 *   put:
 *     summary: Update category by ID
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the category
 *                 example: "Updated Electronics"
 *               parentId:
 *                 type: integer
 *                 description: ID of the parent category
 *                 example: 1
 *               isVisible:
 *                 type: boolean
 *                 description: Visibility status of the category
 *                 example: true
 *               showOnWeb:
 *                 type: boolean
 *                 description: Show category on web
 *                 example: false
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "Category updated"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put(
  "/:id",
  upload.single("image"),
  validation.updateCategoryValidation,
  asyncHandler(controller.updateCategory)
);

/**
 * @swagger
 * /api/category/{id}/visibility:
 *   patch:
 *     summary: Update category visibility
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isVisible
 *             properties:
 *               isVisible:
 *                 type: boolean
 *                 description: Visibility status
 *                 example: false
 *     responses:
 *       200:
 *         description: Category visibility updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "Category visibility updated"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.patch(
  "/:id/visibility",
  validation.hideUnhideCategoryValidation,
  asyncHandler(controller.hideUnhideCategory)
);

/**
 * @swagger
 * /api/category/{id}:
 *   delete:
 *     summary: Soft delete category by ID
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "Category deleted"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete(
  "/:id",
  validation.softDeleteCategoryValidation,
  asyncHandler(controller.softDeleteCategory)
);

/**
 * @swagger
 * /api/category/{parentId}/children:
 *   get:
 *     summary: Get categories by parent ID
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Parent category ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Child categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               data: [
 *                 {
 *                   id: 2,
 *                   name: "Smartphones",
 *                   parentId: 1,
 *                   isVisible: true,
 *                   isDeleted: false
 *                 }
 *               ]
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  "/:parentId/children",
  validation.getCategoriesByParentIdValidation,
  asyncHandler(controller.getCategoriesByParentId)
);

/**
 * @swagger
 * /api/category/{id}/children:
 *   get:
 *     summary: Get category with its children
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Category with children retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  "/:id/children",
  validation.getCategoryByIdValidation,
  asyncHandler(controller.getCategoryWithChildren)
);

/**
 * @swagger
 * /api/category/{id}/parent:
 *   get:
 *     summary: Get category with its parent
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Category with parent retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  "/:id/parent",
  validation.getCategoryByIdValidation,
  asyncHandler(controller.getCategoryWithParent)
);

/**
 * @swagger
 * /api/category/{id}/ancestors:
 *   get:
 *     summary: Get category ancestors
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Category ancestors retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  "/:id/ancestors",
  validation.getCategoryByIdValidation,
  asyncHandler(controller.getCategoryAncestors)
);

/**
 * @swagger
 * /api/category/{id}/depth:
 *   get:
 *     summary: Get category depth level
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Category depth retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  "/:id/depth",
  validation.getCategoryByIdValidation,
  asyncHandler(controller.getCategoryDepth)
);

/**
 * @swagger
 * /api/category/bulk-update:
 *   put:
 *     summary: Bulk update categories
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - updates
 *             properties:
 *               updates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - data
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: Category ID
 *                     data:
 *                       type: object
 *                       description: Update data
 *     responses:
 *       200:
 *         description: Categories updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put("/bulk-update", asyncHandler(controller.bulkUpdateCategories));


/**
 * @swagger
 * /api/category/category-details/{id}:
 *   get:
 *     summary: Get category detailed info by ID
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Category details retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  "/category-details/:id",
  validation.getCategoryByIdValidation,
  asyncHandler(controller.getCategoryDetailsById)
);




module.exports = router;
