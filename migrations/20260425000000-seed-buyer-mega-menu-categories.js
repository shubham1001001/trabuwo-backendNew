'use strict';
const { v7: uuidv7 } = require('uuid');
const slugify = (text) => text.toString().toLowerCase().trim().replace(/&/g, 'and').replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Note: We are completely wiping out the categories first.
    await queryInterface.bulkDelete('home_categories', null, { truncate: true, cascade: true });
    await queryInterface.bulkDelete('category_sections', null, { truncate: true, cascade: true });
    await queryInterface.bulkDelete('categories', null, { truncate: true, cascade: true });

    const dataObj = {
  "categories": {
    "Trending": {
      "name": "Trending",
      "subcategories": [
        {
          "name": "Featured On Trabuwo",
          "children": [
            "Smartphones",
            "Top Brands",
            "Shimla Apples"
          ]
        },
        {
          "name": "All Popular",
          "children": [
            "Jewellery",
            "Men Fashion",
            "Kids",
            "Footwear",
            "Beauty & Personal Care",
            "Grocery",
            "Electronics",
            "Innerwear & Nightwear",
            "Kitchen & Appliances",
            "Bags & Luggage",
            "Healthcare",
            "Stationery & Office Supplies",
            "Bike & Car",
            "Furniture"
          ]
        }
      ]
    },
    "Kurti, Saree & Lehenga": {
      "name": "Kurti, Saree & Lehenga",
      "subcategories": [
        {
          "name": "Sarees",
          "children": [
            "All Sarees",
            "Banarasi Silk Sarees",
            "Cotton Sarees",
            "Georgette Sarees",
            "Chiffon Sarees",
            "Heavy Work Sarees",
            "Net Sarees"
          ]
        },
        {
          "name": "Kurtis",
          "children": [
            "All Kurtis",
            "Anarkali Kurtis",
            "Rayon Kurtis",
            "Cotton Kurtis",
            "Chikankari Kurtis"
          ]
        },
        {
          "name": "Kurta Sets",
          "children": [
            "All Kurta Sets",
            "Kurta Palazzo Sets",
            "Rayon Kurta Sets",
            "Kurta Pant Sets",
            "Cotton Kurta Sets",
            "Sharara Sets"
          ]
        },
        {
          "name": "Dupatta Sets",
          "children": [
            "Dupatta",
            "Cotton Sets",
            "Rayon Sets",
            "Printed Sets"
          ]
        },
        {
          "name": "Suits & Dress Material",
          "children": [
            "All Suits & Dress Material",
            "Cotton Suits",
            "Embroidered Suits",
            "Crepe Suits",
            "Silk Suits",
            "Patiala Suits"
          ]
        },
        {
          "name": "Lehengas",
          "children": [
            "Lehengas",
            "Lehenga Cholis",
            "Net Lehenga",
            "Bridal Lehenga"
          ]
        },
        {
          "name": "Other Ethnic",
          "children": [
            "Blouses",
            "Skirts & Bottomwear",
            "Petticoats",
            "Gown"
          ]
        }
      ]
    },
    "Women Western": {
      "name": "Women Western",
      "subcategories": [
        {
          "name": "Topwear",
          "children": [
            "All Topwear",
            "Tops",
            "T-shirts",
            "Dresses",
            "Jumpsuits",
            "Maternity Kurtis & Dresses"
          ]
        },
        {
          "name": "Bottomwear",
          "children": [
            "All Bottomwear",
            "Jeans & Jeggings",
            "Palazzos",
            "Shorts",
            "Skirts"
          ]
        },
        {
          "name": "Innerwear",
          "children": [
            "Women Innerwear",
            "Bra",
            "Briefs"
          ]
        },
        {
          "name": "Sleepwear",
          "children": [
            "Nightsuits",
            "Women Nightdress"
          ]
        },
        {
          "name": "Maternity Wear",
          "children": [
            "All Maternity & Feedingwear"
          ]
        },
        {
          "name": "Sports Wear",
          "children": []
        }
      ]
    },
    "Men": {
      "name": "Men",
      "subcategories": [
        {
          "name": "Top Wear",
          "children": [
            "Summer T-Shirts",
            "Shirts",
            "T-Shirts",
            "Combos"
          ]
        },
        {
          "name": "Bottom Wear",
          "children": [
            "Jeans",
            "Cargos/Trousers",
            "Dhotis/Lungis"
          ]
        },
        {
          "name": "Ethnic Wear",
          "children": [
            "Kurtas",
            "Kurta Sets",
            "Nehru Jacket"
          ]
        },
        {
          "name": "Innerwear",
          "children": [
            "Vests",
            "Briefs",
            "Boxers"
          ]
        },
        {
          "name": "Sports Wear",
          "children": [
            "Trackpants",
            "Tracksuits",
            "Gym Tshirts"
          ]
        },
        {
          "name": "Night Wear",
          "children": [
            "Pyjamas",
            "Night Shorts",
            "Nightsuits"
          ]
        },
        {
          "name": "Winter Wear",
          "children": [
            "Shrugs",
            "Jackets",
            "Sweatshirts"
          ]
        },
        {
          "name": "Combo Store",
          "children": [
            "Rakhi Specials",
            "Shirts Combo",
            "Innerwear Combo"
          ]
        },
        {
          "name": "Accessories",
          "children": [
            "All Accessories",
            "Watches",
            "Wallets",
            "Jewellery",
            "Sunglasses & Spectacle Frames",
            "Belts"
          ]
        },
        {
          "name": "Footwear",
          "children": [
            "Men Footwear",
            "Men Casual Shoes",
            "Men Sports Shoes",
            "Men Flip Flops and Sandals",
            "Men Formal Shoes",
            "Loafers"
          ]
        }
      ]
    },
    "Kids": {
      "name": "Kids",
      "subcategories": [
        {
          "name": "Boys & Girls 2+ Years",
          "children": [
            "Dresses",
            "Boys Sets",
            "Girls Sets",
            "Ethniewear",
            "Nightwear",
            "Winterwear"
          ]
        },
        {
          "name": "Infant 0-2 Years",
          "children": [
            "Rompers",
            "Baby Sets",
            "Ethniewear"
          ]
        },
        {
          "name": "Toys & Accessories",
          "children": [
            "Soft Toys",
            "Footwear",
            "Stationery",
            "Watches",
            "Bags & Backpacks"
          ]
        }
      ]
    },
    "Home & Kitchen": {
      "name": "Home & Kitchen",
      "subcategories": [
        {
          "name": "Kitchen & Appliances",
          "children": [
            "View All",
            "Kitchen Tools",
            "Storage & Organizers",
            "Appliances",
            "Cookware",
            "Dinnerware",
            "Bakeware",
            "Glasses & Barware"
          ]
        },
        {
          "name": "Home Furnishing",
          "children": [
            "Bedsheets",
            "Curtains & Sheers",
            "Pillows, Cushions & Covers",
            "Cushions & Cushion Covers",
            "Carpets & Doormats",
            "Mattress Protectors",
            "Sofa & Diwan Sets",
            "Towels & Bathrobes",
            "Blankets, Quilts & Dohars"
          ]
        },
        {
          "name": "Home Decor",
          "children": [
            "All Home Decor",
            "Appliances Covers",
            "Clocks",
            "Storage & Organizers",
            "Showpieces",
            "Paintings & Photoframes",
            "Stickers & Wallpapers",
            "Lights",
            "Gifts & Mugs"
          ]
        },
        {
          "name": "Kitchen & Dining",
          "children": [
            "Kitchen Storage",
            "Cookware & Bakeware"
          ]
        },
        {
          "name": "Home Improvement",
          "children": [
            "All Home Essentials",
            "Cleaning Supplies",
            "Gardening",
            "Bathroom Accessories",
            "Insect Protection",
            "Home Tools"
          ]
        }
      ]
    },
    "Jewellery & Accessories": {
      "name": "Jewellery & Accessories",
      "subcategories": [
        {
          "name": "Jewellery",
          "children": [
            "All Jewellery",
            "Jewellery Set",
            "Earrings & Studs",
            "Mangalsutras",
            "Bangles",
            "Necklaces",
            "Rings",
            "Kamarbandh & Maangtika",
            "Anklets",
            "Men Jewellery",
            "Oxidised"
          ]
        },
        {
          "name": "Men Accessories",
          "children": [
            "View All",
            "Watches",
            "Belts & Wallets",
            "Caps & Hats"
          ]
        },
        {
          "name": "Women Accessories",
          "children": [
            "Watches",
            "Hair Accessories",
            "Sunglasses",
            "Socks",
            "Scarves and Stoles"
          ]
        }
      ]
    },
    "Bags & Footwear": {
      "name": "Bags & Footwear",
      "subcategories": [
        {
          "name": "Women Bags",
          "children": [
            "All Women Bags",
            "Handbags",
            "Clutches",
            "Slingbags",
            "Wallets",
            "Backpacks"
          ]
        },
        {
          "name": "Men Bags",
          "children": [
            "Men Wallets",
            "Crossbody Bags & Sling Bags",
            "Waist Bags"
          ]
        },
        {
          "name": "Travel Bags, Luggage and Accessories",
          "children": [
            "View All",
            "Duffle & Trolley Bags"
          ]
        },
        {
          "name": "Men Footwear",
          "children": [
            "Sport Shoes",
            "Casual Shoes",
            "Formal Shoes",
            "Sandals",
            "Loafers"
          ]
        }
      ]
    },
    "Cars & Motorbike": {
      "name": "Cars & Motorbike",
      "subcategories": [
        {
          "name": "Car Accessories",
          "children": [
            "Car Covers",
            "Interior Accessories",
            "Car Mobile Holders",
            "Car Repair Assistance"
          ]
        },
        {
          "name": "Motorbike Accessories",
          "children": [
            "Helmets",
            "Bike Accessories",
            "Bike LED Lights",
            "Safety Gear & Clothing"
          ]
        }
      ]
    },
    "Office Supplies & Stationery": {
      "name": "Office Supplies & Stationery",
      "subcategories": [
        {
          "name": "Office Supplies & Stationery",
          "children": [
            "Diaries & Notebooks",
            "Adhesives & Tapes",
            "Files & Desks Organizers",
            "Pens & Pencils",
            "Paintings & Photoframes"
          ]
        }
      ]
    },
    "Pet Supplies": {
      "name": "Pet Supplies",
      "subcategories": [
        {
          "name": "Pet Supplies",
          "children": [
            "Pet Toys",
            "Pet Grooming",
            "Pet Food",
            "Pet Clothing",
            "Pet Health"
          ]
        }
      ]
    },
    "Food & Drinks": {
      "name": "Food & Drinks",
      "subcategories": [
        {
          "name": "Food & Drinks",
          "children": [
            "Dry Fruits",
            "Tea",
            "Masalas",
            "Coffee",
            "Ready to Cook"
          ]
        }
      ]
    },
    "Musical Instruments": {
      "name": "Musical Instruments",
      "subcategories": [
        {
          "name": "Musical Instruments",
          "children": [
            "String Instruments",
            "Musical Accessories",
            "Wind Instruments",
            "All Musical Instruments"
          ]
        }
      ]
    },
    "Books": {
      "name": "Books",
      "subcategories": [
        {
          "name": "Fiction & Non Fiction",
          "children": [
            "Childrens Books",
            "Self Help Books",
            "Novels",
            "Religious Books",
            "View All Books"
          ]
        },
        {
          "name": "Academic Books",
          "children": [
            "School Textbooks & Guides",
            "Reference Books"
          ]
        }
      ]
    },
    "Sports & Fitness": {
      "name": "Sports & Fitness",
      "subcategories": [
        {
          "name": "Fitness",
          "children": [
            "Yoga",
            "Hand Grip Strengthener",
            "Tummy trimmers",
            "Skipping Ropes",
            "Sweat Belts"
          ]
        },
        {
          "name": "Sports",
          "children": [
            "Badminton",
            "Skating",
            "Football",
            "Cricket"
          ]
        }
      ]
    },
    "Electronics": {
      "name": "Electronics",
      "subcategories": [
        {
          "name": "Audio",
          "children": [
            "Bluetooth Headphone & Earphones",
            "Wired Headphones & Earphones",
            "Speakers"
          ]
        },
        {
          "name": "Mobile & Accessories",
          "children": [
            "Smartwatches",
            "Mobile Holders",
            "Mobile cases and covers",
            "Mobile Chargers",
            "Mobile & Accessories - View All"
          ]
        },
        {
          "name": "Smart Wearables",
          "children": [
            "VR Box",
            "Tripod",
            "Microphone",
            "Photo & Video Accessories"
          ]
        }
      ]
    },
    "Beauty & Health": {
      "name": "Beauty & Health",
      "subcategories": [
        {
          "name": "Make up",
          "children": [
            "Face",
            "Eyes",
            "Lips",
            "Nails",
            "Make up Kits",
            "Brushes & Tools",
            "Makeup Accessories"
          ]
        },
        {
          "name": "Skincare",
          "children": [
            "View All",
            "Face Masks & Peels",
            "Facecare",
            "Haircare",
            "Bath & Shower"
          ]
        },
        {
          "name": "Baby & Mom",
          "children": [
            "Baby Personal Care",
            "Mom Care"
          ]
        },
        {
          "name": "Mens Care",
          "children": [
            "Beard Care",
            "Fragrances for Men"
          ]
        },
        {
          "name": "Healthcare",
          "children": [
            "Ear Buds & Cleaners",
            "Condoms",
            "Sanitary Pads",
            "Dental Care",
            "Weight Management",
            "Health Monitors"
          ]
        }
      ]
    }
  }
}
;
    const data = dataObj.categories || dataObj;
    
    let displayOrder = 1;
    for (const mainKey of Object.keys(data)) {
      const mainCat = data[mainKey];
      const mainSlug = slugify(mainCat.name);
      const [main] = await queryInterface.sequelize.query(
        `INSERT INTO categories (public_id, name, slug, is_visible, display_order_web, created_at, updated_at) 
         VALUES ('${uuidv7()}', '${mainCat.name.replace(/'/g, "''")}', '${mainSlug}', true, ${displayOrder++}, NOW(), NOW()) RETURNING id`
      );
      const mainId = main[0].id;

      if (mainCat.subcategories) {
        for (const subCat of mainCat.subcategories) {
          const subSlug = `${mainSlug}-${slugify(subCat.name)}`;
          const [sub] = await queryInterface.sequelize.query(
            `INSERT INTO categories (public_id, name, slug, parent_id, is_visible, created_at, updated_at) 
             VALUES ('${uuidv7()}', '${subCat.name.replace(/'/g, "''")}', '${subSlug}', ${mainId}, true, NOW(), NOW()) RETURNING id`
          );
          const subId = sub[0].id;
          if (subCat.children) {
            for (const leaf of subCat.children) {
              const leafSlug = `${subSlug}-${slugify(leaf)}`;
              await queryInterface.sequelize.query(
                `INSERT INTO categories (public_id, name, slug, parent_id, is_visible, created_at, updated_at) 
                 VALUES ('${uuidv7()}', '${leaf.replace(/'/g, "''")}', '${leafSlug}', ${subId}, true, NOW(), NOW())`
              );
            }
          }
        }
      }
    }
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('categories', null, {});
  }
};
