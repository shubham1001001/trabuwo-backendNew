require('dotenv').config();
const axios = require('axios');
const sequelize = require('./src/config/database');
const HomeCategory = require('./src/modules/homeCategory/model');
const Category = require('./src/modules/category/model');
const s3Service = require('./src/services/s3');
const config = require('config');

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('Connected to Database');

        const categories = await Category.findAll();
        const findId = (name) => {
            const match = categories.find(c => c.name.toLowerCase().includes(name.toLowerCase()));
            return match ? match.id : null;
        };

        const data = [
            { name: 'Ethnic Wear', search: 'Ethnic', order: 1, url: 'https://picsum.photos/400/400?random=1' },
            { name: 'Western Dresses', search: 'Western', order: 2, url: 'https://picsum.photos/400/400?random=2' },
            { name: 'Menswear', search: 'Men', order: 3, url: 'https://picsum.photos/400/400?random=3' },
            { name: 'Footwear', search: 'Footwear', order: 4, url: 'https://picsum.photos/400/400?random=4' },
            { name: 'Home Decor', search: 'Home', order: 5, url: 'https://picsum.photos/400/400?random=5' },
            { name: 'Beauty', search: 'Beauty', order: 6, url: 'https://picsum.photos/400/400?random=6' },
            { name: 'Accessories', search: 'Jewellery', order: 7, url: 'https://picsum.photos/400/400?random=7' },
            { name: 'Grocery', search: 'Grocery', order: 8, url: 'https://picsum.photos/400/400?random=8' }
        ];

        console.log('Starting S3 Uploads...');

        for (let item of data) {
            // Download image
            const response = await axios.get(item.url, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data, 'binary');
            
            // Upload to S3
            const key = `home-category-images/seed/${Date.now()}-${item.name.replace(/\s+/g, '-').toLowerCase()}.webp`;
            await s3Service.uploadBuffer(buffer, key, 'image/webp');
            const imgUrl = `${config.get('aws.cloudfront.domain')}/${key}`;

            // Create record
            await HomeCategory.create({
                name: item.name,
                redirectCategoryId: findId(item.search),
                displayOrder: item.order,
                imgUrl: imgUrl,
                isActive: true,
                showOnHomePage: true,
                publicId: 'hc_' + Math.random().toString(36).substr(2, 9),
                deviceType: 'both',
                filters: {}
            });
            console.log(`Successfully added: ${item.name} with S3 Image: ${imgUrl}`);
        }

        console.log('All 8 Home Categories added to Trabuwo successfully!');
    } catch (err) {
        console.error('Seeding ERROR:', err);
    } finally {
        process.exit();
    }
}

seed();
