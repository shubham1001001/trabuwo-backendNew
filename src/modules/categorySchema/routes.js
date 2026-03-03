const express = require("express");
const router = express.Router();
const controller = require("./controller");
const validation = require("./validation");
const asyncHandler = require("../../utils/asyncHandler");
const { authenticate } = require("../../middleware/auth");

/**
 * @swagger
 * /api/category-schema/filters/{categoryId}:
 *   get:
 *     summary: Get available filters for a category
 *     tags: [Category Schema]
 *     description: Returns filterable fields for a category. If the category has children, filters are aggregated from all leaf descendant categories. When multiple categories have the same fieldName, their options are merged and deduplicated.
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
 *         description: Available filters retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "Available filters retrieved successfully"
 *               data:
 *                 productFilters:
 *                   - fieldName: "brand"
 *                     fieldType: "select"
 *                     label: "Brand"
 *                     options: ["Apple", "Samsung", "Sony"]
 *                     section: "basicDetails"
 *                   - fieldName: "color"
 *                     fieldType: "select"
 *                     label: "Color"
 *                     options: ["Red", "Blue", "Green", "Black"]
 *                     section: "additionalDetails"
 *                 variantFilters:
 *                   - fieldName: "size"
 *                     fieldType: "select"
 *                     label: "Size"
 *                     options: ["S", "M", "L", "XL"]
 *                     section: "addVariant"
 *                 childrenOrSiblings:
 *                   - id: 101
 *                     publicId: "019a8example-children-or-siblings"
 *                     name: "Smartphones"
 *                     slug: "smartphones"
 *                     parentId: 10
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  "/filters/:categoryId",
  validation.getAvailableFiltersValidation,
  asyncHandler(controller.getAvailableFilters)
);

/**
 * @swagger
 * /api/category-schema/all-filters:
 *   get:
 *     summary: Get all unique filterable fields across all categories
 *     tags: [Category Schema]
 *     description: Returns all unique filterable fields from all categories. When multiple categories have the same fieldName, their options are merged and deduplicated.
 *     responses:
 *       200:
 *         description: All unique filterable fields retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "All unique filterable fields retrieved successfully"
 *               data:
 *                 productFilters:
 *                   - fieldName: "brand"
 *                     fieldType: "select"
 *                     label: "Brand"
 *                     options: ["Apple", "Samsung", "Sony"]
 *                     section: "basicDetails"
 *                   - fieldName: "color"
 *                     fieldType: "select"
 *                     label: "Color"
 *                     options: ["Red", "Blue", "Green", "Black"]
 *                     section: "additionalDetails"
 *                 variantFilters:
 *                   - fieldName: "size"
 *                     fieldType: "select"
 *                     label: "Size"
 *                     options: ["S", "M", "L", "XL"]
 *                     section: "addVariant"
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get("/all-filters", asyncHandler(controller.getAllUniqueFilters));

/**
 * @swagger
 * /api/category-schema/{id}:
 *   get:
 *     summary: Get category schema by ID
 *     tags: [Category Schema]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Schema ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Category schema retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               data:
 *                 id: 1
 *                 categoryId: 1
 *                 fieldName: "brand"
 *                 fieldType: "text"
 *                 label: "Brand Name"
 *                 description: "Brand name as shown on the product page"
 *                 required: true
 *                 category: {
 *                   id: 1,
 *                   name: "Electronics"
 *                 }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get("/:id", asyncHandler(controller.getCategorySchemaById));

/**
 * @swagger
 * /api/category-schema/category/{categoryId}:
 *   get:
 *     summary: Get schema fields for a specific category
 *     tags: [Category Schema]
 *     security:
 *       - bearerAuth: []
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
 *         description: Category schema fields retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               data: [
 *                 {
 *                   id: 1,
 *                   fieldName: "brand",
 *                   fieldType: "text",
 *                   label: "Brand Name",
 *                   required: true,
 *                   order: 1
 *                 },
 *                 {
 *                   id: 2,
 *                   fieldName: "color",
 *                   fieldType: "select",
 *                   label: "Color",
 *                   description: "Primary color of the product",
 *                   required: false,
 *                   options: ["Red", "Blue", "Green"],
 *                   order: 2
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
  "/category/:categoryId",
  validation.getCategorySchemaValidation,
  asyncHandler(controller.getCategorySchemasByCategoryId)
);

router.use(authenticate);
// router.use(requireRole("admin"));

/**
 * @swagger
 * /api/category-schema/category/{categoryId}/schemas:
 *   delete:
 *     summary: Delete all category schema fields for a category
 *     tags: [Category Schema]
 *     security:
 *       - bearerAuth: []
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
 *         description: Category schemas deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "3 category schema(s) deleted successfully"
 *               data:
 *                 deletedCount: 3
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
  "/category/:categoryId/schemas",
  validation.deleteCategorySchemasByCategoryIdValidation,
  asyncHandler(controller.deleteCategorySchemasByCategoryId)
);

/**
 * @swagger
 * /api/category-schema:
 *   post:
 *     summary: Create a new category schema field
 *     tags: [Category Schema]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoryId
 *               - fieldName
 *               - fieldType
 *               - label
 *             properties:
 *               categoryId:
 *                 type: integer
 *                 description: ID of the category
 *                 example: 1
 *               fieldName:
 *                 type: string
 *                 description: Unique field name
 *                 example: "brand"
 *               fieldType:
 *                 type: string
 *                 enum: [text, number, select, multiselect, boolean, file]
 *                 description: Type of the form field
 *                 example: "text"
 *               label:
 *                 type: string
 *                 description: Display label for the field
 *                 example: "Brand Name"
 *               required:
 *                 type: boolean
 *                 description: Whether the field is required
 *                 example: true
 *               options:
 *                 type: array
 *                 description: Options for select/multiselect fields
 *                 example: ["Apple", "Samsung", "Google"]
 *               validation:
 *                 type: object
 *                 description: Validation rules
 *                 example: { "minLength": 2, "maxLength": 50 }
 *               order:
 *                 type: integer
 *                 description: Display order
 *                 example: 1
 *     responses:
 *       201:
 *         description: Category schema created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "Category schema created"
 *               data:
 *                 id: 1
 *                 categoryId: 1
 *                 fieldName: "brand"
 *                 fieldType: "text"
 *                 label: "Brand Name"
 *                 description: "Brand name as shown on the product page"
 *                 required: true
 *                 order: 1
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
  validation.createCategorySchemaValidation,
  asyncHandler(controller.createCategorySchema)
);

/**
 * @swagger
 * /api/category-schema/bulk-create:
 *   post:
 *     summary: Bulk create multiple category schema fields
 *     tags: [Category Schema]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - schemas
 *             properties:
 *               schemas:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - categoryId
 *                     - fieldName
 *                     - fieldType
 *                     - label
 *                   properties:
 *                     categoryId:
 *                       type: integer
 *                       description: ID of the category
 *                       example: 1
 *                     fieldName:
 *                       type: string
 *                       description: Unique field name
 *                       example: "brand"
 *                     fieldType:
 *                       type: string
 *                       enum: [text, number, select, multiselect, boolean, file]
 *                       description: Type of the form field
 *                       example: "text"
 *                     label:
 *                       type: string
 *                       description: Display label for the field
 *                       example: "Brand Name"
 *                     required:
 *                       type: boolean
 *                       description: Whether the field is required
 *                       example: true
 *                     options:
 *                       type: array
 *                       description: Options for select/multiselect fields
 *                       example: ["Apple", "Samsung", "Google"]
 *                     validation:
 *                       type: object
 *                       description: Validation rules
 *                       example: { "minLength": 2, "maxLength": 50 }
 *                     order:
 *                       type: integer
 *                       description: Display order
 *                       example: 1
 *     responses:
 *       201:
 *         description: Category schemas created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "3 schemas created successfully"
 *               data: [
 *                 {
 *                   id: 1,
 *                   categoryId: 1,
 *                   fieldName: "brand",
 *                   fieldType: "text",
 *                   label: "Brand Name",
 *                   required: true,
 *                   order: 1
 *                 }
 *               ]
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
  "/bulk-create",
  validation.bulkCreateSchemasValidation,
  asyncHandler(controller.bulkCreateSchemas)
);

/**
 * @swagger
 * /api/category-schema/{categoryId}/excel-template:
 *   get:
 *     summary: Download Excel template for category schema
 *     tags: [Category Schema]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID to generate template for
 *         example: 1
 *     responses:
 *       200:
 *         description: Excel template downloaded successfully
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *             example: "Excel file content"
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
  "/:categoryId/excel-template",
  validation.downloadExcelTemplateValidation,
  asyncHandler(controller.downloadExcelTemplate)
);

/**
 * @swagger
 * /api/category-schema:
 *   get:
 *     summary: Get all category schemas
 *     tags: [Category Schema]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fieldType
 *         schema:
 *           type: string
 *           enum: [text, number, select, multiselect, boolean, file]
 *         description: Filter by field type
 *     responses:
 *       200:
 *         description: Category schemas retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               data: [
 *                 {
 *                   id: 1,
 *                   categoryId: 1,
 *                   fieldName: "brand",
 *                   fieldType: "text",
 *                   label: "Brand Name",
 *                   description: "Brand name as shown on the product page",
 *                   required: true,
 *                   category: {
 *                     id: 1,
 *                     name: "Electronics"
 *                   }
 *                 }
 *               ]
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get("/", asyncHandler(controller.getAllCategorySchemas));

/**
 * @swagger
 * /api/category-schema/{id}:
 *   put:
 *     summary: Update category schema field
 *     tags: [Category Schema]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Schema ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fieldName:
 *                 type: string
 *                 description: Unique field name
 *                 example: "brand_name"
 *               fieldType:
 *                 type: string
 *                 enum: [text, number, select, multiselect, boolean, file]
 *                 description: Type of the form field
 *                 example: "text"
 *               label:
 *                 type: string
 *                 description: Display label for the field
 *                 example: "Brand Name"
 *               required:
 *                 type: boolean
 *                 description: Whether the field is required
 *                 example: true
 *               options:
 *                 type: array
 *                 description: Options for select/multiselect fields
 *                 example: ["Apple", "Samsung", "Google"]
 *               validation:
 *                 type: object
 *                 description: Validation rules
 *                 example: { "minLength": 2, "maxLength": 50 }
 *               order:
 *                 type: integer
 *                 description: Display order
 *                 example: 1
 *     responses:
 *       200:
 *         description: Category schema updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "Category schema updated"
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
  validation.updateCategorySchemaValidation,
  asyncHandler(controller.updateCategorySchema)
);

/**
 * @swagger
 * /api/category-schema/{id}:
 *   delete:
 *     summary: Delete category schema field
 *     tags: [Category Schema]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Schema ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Category schema deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "Category schema deleted"
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
  validation.deleteCategorySchemaValidation,
  asyncHandler(controller.deleteCategorySchema)
);

/**
 * @swagger
 * /api/category-schema/field-type/{fieldType}:
 *   get:
 *     summary: Get schemas by field type
 *     tags: [Category Schema]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fieldType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [text, number, select, multiselect, boolean, file]
 *         description: Field type to filter by
 *         example: "text"
 *     responses:
 *       200:
 *         description: Schemas retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get(
  "/field-type/:fieldType",
  validation.getSchemasByFieldTypeValidation,
  asyncHandler(controller.getSchemasByFieldType)
);

/**
 * @swagger
 * /api/category-schema/bulk-update:
 *   put:
 *     summary: Bulk update multiple schemas
 *     tags: [Category Schema]
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
 *                       description: Schema ID to update
 *                     data:
 *                       type: object
 *                       description: Data to update
 *     responses:
 *       200:
 *         description: Schemas updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put(
  "/bulk-update",
  validation.bulkUpdateSchemasValidation,
  asyncHandler(controller.bulkUpdateSchemas)
);

/**
 * @swagger
 * /api/category-schema/validate/{categoryId}:
 *   post:
 *     summary: Validate data against category schema
 *     tags: [Category Schema]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID to validate against
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Data to validate
 *     responses:
 *       200:
 *         description: Data validation passed
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post(
  "/validate/:categoryId",
  validation.validateSchemaForCategoryValidation,
  asyncHandler(controller.validateSchemaForCategory)
);

module.exports = router;
