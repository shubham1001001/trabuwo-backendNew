/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const sequelize = require("../src/config/database");
const Category = require("../src/modules/category/model");
const { generateUniqueHierarchicalSlug } = require("../src/modules/category/helper");

const DATA_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "Buyer",
  "src",
  "data",
  "categoryData.json"
);

const HARD_RESET = process.argv.includes("--hard");

function getJsonData() {
  if (!fs.existsSync(DATA_PATH)) {
    throw new Error(`categoryData.json not found at: ${DATA_PATH}`);
  }

  const raw = fs.readFileSync(DATA_PATH, "utf8");
  const parsed = JSON.parse(raw);
  const categories = parsed?.categories;

  if (!categories || typeof categories !== "object") {
    throw new Error("Invalid JSON format. Expected { categories: { ... } }");
  }

  return categories;
}

async function createCategoryNode({
  name,
  parentId = null,
  breadCrumb,
  isRoot = false,
  displayOrderWeb = null,
  activeCategories,
  transaction,
}) {
  const slug = generateUniqueHierarchicalSlug(
    activeCategories,
    null,
    name,
    parentId,
    null
  );

  const created = await Category.create(
    {
      name,
      parentId,
      slug,
      breadCrumb,
      isVisible: true,
      isDeleted: false,
      showOnWeb: isRoot,
      displayOrderWeb: isRoot ? displayOrderWeb : null,
    },
    { transaction }
  );

  activeCategories.push(created.toJSON());
  return created;
}

async function reseed() {
  const categoriesJson = getJsonData();
  const rootNames = Object.keys(categoriesJson);

  await sequelize.authenticate();
  console.log("Database connected.");

  const transaction = await sequelize.transaction();
  try {
    if (HARD_RESET) {
      console.log("Hard reset mode: truncating categories (CASCADE).");
      await sequelize.query("TRUNCATE TABLE categories RESTART IDENTITY CASCADE;", {
        transaction,
      });
    } else {
      console.log("Soft reset mode: marking existing categories as deleted.");
      await Category.update(
        { isDeleted: true, showOnWeb: false },
        { where: {}, transaction }
      );
    }

    const activeCategories = [];
    let createdRoot = 0;
    let createdSub = 0;
    let createdLeaf = 0;

    for (let i = 0; i < rootNames.length; i += 1) {
      const rootName = rootNames[i];
      const root = categoriesJson[rootName];
      const rootDisplayName = root?.name || rootName;

      const rootCreated = await createCategoryNode({
        name: rootDisplayName,
        parentId: null,
        breadCrumb: rootDisplayName,
        isRoot: true,
        displayOrderWeb: i + 1,
        activeCategories,
        transaction,
      });
      createdRoot += 1;

      const subcategories = Array.isArray(root?.subcategories)
        ? root.subcategories
        : [];

      for (const sub of subcategories) {
        const subName = sub?.name;
        if (!subName) continue;

        const subBreadCrumb = `${rootDisplayName} > ${subName}`;
        const subCreated = await createCategoryNode({
          name: subName,
          parentId: rootCreated.id,
          breadCrumb: subBreadCrumb,
          isRoot: false,
          activeCategories,
          transaction,
        });
        createdSub += 1;

        const children = Array.isArray(sub?.children) ? sub.children : [];
        for (const childName of children) {
          if (!childName || typeof childName !== "string") continue;
          await createCategoryNode({
            name: childName,
            parentId: subCreated.id,
            breadCrumb: `${subBreadCrumb} > ${childName}`,
            isRoot: false,
            activeCategories,
            transaction,
          });
          createdLeaf += 1;
        }
      }
    }

    await transaction.commit();
    console.log("Category reseed completed.");
    console.log(
      `Created root=${createdRoot}, subcategories=${createdSub}, leaf=${createdLeaf}, total=${createdRoot + createdSub + createdLeaf}`
    );
    console.log(`Mode: ${HARD_RESET ? "hard (truncate)" : "soft (isDeleted=true on old rows)"}`);
  } catch (error) {
    await transaction.rollback();
    console.error("Category reseed failed:", error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

reseed().catch((err) => {
  console.error(err);
  process.exit(1);
});

