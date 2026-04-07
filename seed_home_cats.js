const sequelize = require('./src/config/database');
const { Category } = require('./src/modules/category/model');
const { HomeCategory } = require('./src/modules/homeCategory/model');

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('Database connected');

        const cats = await Category.findAll();
        const findId = (name) => {
            const match = cats.find(c => c.name.toLowerCase().includes(name.toLowerCase()));
            return match ? match.id : null;
        };

        const data = [
            { name: 'Ethnic Wear', search: 'Ethnic', order: 1, img: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&q=80&w=200' },
            { name: 'Western Dresses', search: 'Western', order: 2, img: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=200' },
            { name: 'Menswear', search: 'Men', order: 3, img: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&q=80&w=200' },
            { name: 'Footwear', search: 'Footwear', order: 4, img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=200' },
            { name: 'Home Decor', search: 'Home', order: 5, img: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=200' },
            { name: 'Beauty', search: 'Beauty', order: 6, img: 'https://images.unsplash.com/photo-1596462502278-27bfdc4033c8?auto=format&fit=crop&q=80&w=200' },
            { name: 'Accessories', search: 'Jewellery', order: 7, img: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&q=80&w=200' },
            { name: 'Grocery', search: 'Grocery', order: 8, img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200' }
        ];

        // Clear existing home categories to start fresh
        await HomeCategory.destroy({ where: {}, truncate: false });

        for (let item of data) {
            await HomeCategory.create({
                name: item.name,
                redirectCategoryId: findId(item.search),
                displayOrder: item.order,
                imgUrl: item.img,
                isActive: true,
                showOnHomePage: true,
                publicId: 'hc_' + Date.now() + Math.random().toString(36).substr(2, 5),
                deviceType: 'both',
                filters: {}
            });
            console.log(`Uploaded: ${item.name}`);
        }

        console.log('Successfully seeded 8 home categories');
    } catch (err) {
        console.error('Seeding error:', err);
    } finally {
        process.exit();
    }
}

seed();
