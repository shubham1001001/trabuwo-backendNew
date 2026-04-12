/* eslint-disable no-console */
const sequelize = require("../src/config/database");
const { Op } = require("sequelize");
const Category = require("../src/modules/category/model");
const HomeCategory = require("../src/modules/homeCategory/model");

function printSection(title) {
  console.log(`\n=== ${title} ===`);
}

function rowLabel(row) {
  return `id=${row.id}, name="${row.name}"`;
}

async function run() {
  await sequelize.authenticate();
  console.log("Database connected.");

  const [categories, homeCategories] = await Promise.all([
    Category.findAll({
      where: { isDeleted: false },
      attributes: ["id", "name", "publicId", "isDeleted", "parentId"],
      raw: true,
    }),
    HomeCategory.findAll({
      where: { isDeleted: false },
      attributes: [
        "id",
        "name",
        "publicId",
        "parentId",
        "redirectCategoryId",
        "displayOrder",
        "isActive",
        "showOnHomePage",
        "deviceType",
      ],
      raw: true,
    }),
  ]);

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const homeById = new Map(homeCategories.map((h) => [h.id, h]));

  printSection("Summary");
  console.log(`categories(active/non-deleted): ${categories.length}`);
  console.log(`home_categories(non-deleted): ${homeCategories.length}`);

  const rootHome = homeCategories.filter((h) => h.parentId == null);
  const activeWebHome = rootHome.filter(
    (h) =>
      h.isActive === true &&
      h.showOnHomePage === true &&
      (h.deviceType === "web" || h.deviceType === "both")
  );
  console.log(`home root categories: ${rootHome.length}`);
  console.log(`active + showOnHomePage + web/both: ${activeWebHome.length}`);

  const issues = {
    invalidRedirect: [],
    invalidParentLink: [],
    duplicateDisplayOrderWebHome: [],
    webHomeCountExceeded: [],
  };

  for (const hc of homeCategories) {
    if (hc.redirectCategoryId != null && !categoryById.has(hc.redirectCategoryId)) {
      issues.invalidRedirect.push(hc);
    }
    if (hc.parentId != null && !homeById.has(hc.parentId)) {
      issues.invalidParentLink.push(hc);
    }
  }

  // duplicate display order only for home-page visible active root web/both
  const orderMap = new Map();
  for (const hc of activeWebHome) {
    if (!orderMap.has(hc.displayOrder)) orderMap.set(hc.displayOrder, []);
    orderMap.get(hc.displayOrder).push(hc);
  }
  for (const [, list] of orderMap.entries()) {
    if (list.length > 1) {
      issues.duplicateDisplayOrderWebHome.push(list);
    }
  }

  if (activeWebHome.length > 8) {
    issues.webHomeCountExceeded = activeWebHome;
  }

  printSection("Invalid redirectCategoryId");
  if (issues.invalidRedirect.length === 0) {
    console.log("OK");
  } else {
    issues.invalidRedirect.forEach((r) => {
      console.log(
        `${rowLabel(r)} -> redirectCategoryId=${r.redirectCategoryId} (missing in categories)`
      );
    });
  }

  printSection("Invalid parentId in home_categories");
  if (issues.invalidParentLink.length === 0) {
    console.log("OK");
  } else {
    issues.invalidParentLink.forEach((r) => {
      console.log(`${rowLabel(r)} -> parentId=${r.parentId} (missing in home_categories)`);
    });
  }

  printSection("Duplicate displayOrder (active web home roots)");
  if (issues.duplicateDisplayOrderWebHome.length === 0) {
    console.log("OK");
  } else {
    issues.duplicateDisplayOrderWebHome.forEach((dupList) => {
      const order = dupList[0].displayOrder;
      console.log(`displayOrder=${order}`);
      dupList.forEach((r) => console.log(`  - ${rowLabel(r)}, deviceType=${r.deviceType}`));
    });
  }

  printSection("Web home active count limit (max 8)");
  if (issues.webHomeCountExceeded.length === 0) {
    console.log("OK");
  } else {
    console.log(`Exceeded: ${issues.webHomeCountExceeded.length} rows`);
    issues.webHomeCountExceeded.forEach((r) =>
      console.log(`  - ${rowLabel(r)}, order=${r.displayOrder}, device=${r.deviceType}`)
    );
  }

  const hasAnyIssue =
    issues.invalidRedirect.length > 0 ||
    issues.invalidParentLink.length > 0 ||
    issues.duplicateDisplayOrderWebHome.length > 0 ||
    issues.webHomeCountExceeded.length > 0;

  printSection("Result");
  console.log(hasAnyIssue ? "ISSUES_FOUND" : "HEALTHY");
}

run()
  .catch((err) => {
    console.error("Health check failed:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close().catch(() => {});
  });

