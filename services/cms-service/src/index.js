const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const winston = require('winston');
const { MongoClient } = require('mongodb');
const multer = require('multer');
const sharp = require('sharp');
const { marked } = require('marked');
const slugify = require('slugify');
const moment = require('moment');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;

class GACPCMSService {
    constructor() {
        this.app = express();
        this.port = process.env.CMS_PORT || 4008;
        this.mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017';
        this.dbName = 'gacp_cms';
        this.db = null;
        
        this.setupLogger();
        this.setupMiddleware();
        this.setupMulter();
        this.setupRoutes();
    }

    setupLogger() {
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.colorize(),
                winston.format.simple()
            ),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ filename: 'logs/cms-service.log' })
            ]
        });
    }

    setupMiddleware() {
        this.app.use(helmet());
        this.app.use(compression());
        this.app.use(cors({
            origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
            credentials: true
        }));
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
        this.app.use('/uploads', express.static('uploads'));
    }

    setupMulter() {
        const storage = multer.diskStorage({
            destination: async (req, file, cb) => {
                const uploadDir = 'uploads/content';
                try {
                    await fs.mkdir(uploadDir, { recursive: true });
                    cb(null, uploadDir);
                } catch (error) {
                    cb(error);
                }
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
            }
        });

        this.upload = multer({
            storage: storage,
            limits: {
                fileSize: 10 * 1024 * 1024 // 10MB
            },
            fileFilter: (req, file, cb) => {
                const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
                if (allowedTypes.includes(file.mimetype)) {
                    cb(null, true);
                } else {
                    cb(new Error('Invalid file type'));
                }
            }
        });
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ 
                status: 'healthy', 
                service: 'GACP CMS Service',
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            });
        });

        // Content Management Routes
        this.app.post('/api/content', this.createContent.bind(this));
        this.app.get('/api/content', this.getContent.bind(this));
        this.app.get('/api/content/:id', this.getContentById.bind(this));
        this.app.put('/api/content/:id', this.updateContent.bind(this));
        this.app.delete('/api/content/:id', this.deleteContent.bind(this));
        this.app.post('/api/content/:id/publish', this.publishContent.bind(this));
        this.app.post('/api/content/:id/unpublish', this.unpublishContent.bind(this));

        // Page Management Routes
        this.app.post('/api/pages', this.createPage.bind(this));
        this.app.get('/api/pages', this.getPages.bind(this));
        this.app.get('/api/pages/:slug', this.getPageBySlug.bind(this));
        this.app.put('/api/pages/:id', this.updatePage.bind(this));
        this.app.delete('/api/pages/:id', this.deletePage.bind(this));

        // Menu Management Routes
        this.app.post('/api/menus', this.createMenu.bind(this));
        this.app.get('/api/menus', this.getMenus.bind(this));
        this.app.get('/api/menus/:name', this.getMenuByName.bind(this));
        this.app.put('/api/menus/:id', this.updateMenu.bind(this));
        this.app.delete('/api/menus/:id', this.deleteMenu.bind(this));

        // Media Management Routes
        this.app.post('/api/media/upload', this.upload.single('file'), this.uploadMedia.bind(this));
        this.app.get('/api/media', this.getMedia.bind(this));
        this.app.delete('/api/media/:id', this.deleteMedia.bind(this));

        // Multilingual Support Routes
        this.app.get('/api/languages', this.getLanguages.bind(this));
        this.app.post('/api/translations', this.createTranslation.bind(this));
        this.app.get('/api/translations/:contentId', this.getTranslations.bind(this));

        // GACP Specific Content Routes
        this.app.get('/api/gacp/standards', this.getGACPStandards.bind(this));
        this.app.get('/api/gacp/guidelines', this.getGACPGuidelines.bind(this));
        this.app.get('/api/gacp/documentation', this.getGACPDocumentation.bind(this));
        this.app.get('/api/herbal/database', this.getHerbalDatabase.bind(this));

        // Search and Filter Routes
        this.app.get('/api/search', this.searchContent.bind(this));
        this.app.get('/api/categories', this.getCategories.bind(this));
        this.app.get('/api/tags', this.getTags.bind(this));
    }

    // Content Management Methods
    async createContent(req, res) {
        try {
            const schema = Joi.object({
                title: Joi.string().required(),
                content: Joi.string().required(),
                type: Joi.string().valid('article', 'page', 'guide', 'standard', 'documentation').required(),
                category: Joi.string().required(),
                tags: Joi.array().items(Joi.string()),
                language: Joi.string().default('th'),
                status: Joi.string().valid('draft', 'review', 'published').default('draft'),
                author: Joi.string().required(),
                meta: Joi.object({
                    description: Joi.string(),
                    keywords: Joi.array().items(Joi.string()),
                    canonicalUrl: Joi.string().uri()
                }),
                seo: Joi.object({
                    title: Joi.string(),
                    description: Joi.string(),
                    keywords: Joi.string()
                })
            });

            const { error, value } = schema.validate(req.body);
            if (error) {
                return res.status(400).json({ error: error.details[0].message });
            }

            const content = {
                id: uuidv4(),
                ...value,
                slug: slugify(value.title, { lower: true, locale: 'th' }),
                createdAt: new Date(),
                updatedAt: new Date(),
                publishedAt: null,
                views: 0,
                likes: 0
            };

            // Process Markdown content
            if (content.type === 'guide' || content.type === 'documentation') {
                content.htmlContent = marked(content.content);
            }

            await this.db.collection('content').insertOne(content);

            this.logger.info(`Content created: ${content.id} - ${content.title}`);
            res.status(201).json(content);
        } catch (error) {
            this.logger.error('Error creating content:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getContent(req, res) {
        try {
            const {
                type, category, language = 'th', status = 'published',
                page = 1, limit = 20, sort = 'createdAt', order = 'desc'
            } = req.query;

            const filter = { language, status };
            if (type) filter.type = type;
            if (category) filter.category = category;

            const sortObj = { [sort]: order === 'desc' ? -1 : 1 };
            const skip = (parseInt(page) - 1) * parseInt(limit);

            const content = await this.db.collection('content')
                .find(filter)
                .sort(sortObj)
                .skip(skip)
                .limit(parseInt(limit))
                .toArray();

            const total = await this.db.collection('content').countDocuments(filter);

            res.json({
                content,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total / parseInt(limit))
                }
            });
        } catch (error) {
            this.logger.error('Error fetching content:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getContentById(req, res) {
        try {
            const { id } = req.params;
            const content = await this.db.collection('content').findOne({ id });

            if (!content) {
                return res.status(404).json({ error: 'Content not found' });
            }

            // Increment view count
            await this.db.collection('content').updateOne(
                { id },
                { $inc: { views: 1 } }
            );

            res.json(content);
        } catch (error) {
            this.logger.error('Error fetching content by ID:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async updateContent(req, res) {
        try {
            const { id } = req.params;
            const updates = {
                ...req.body,
                updatedAt: new Date()
            };

            // Re-generate slug if title changed
            if (updates.title) {
                updates.slug = slugify(updates.title, { lower: true, locale: 'th' });
            }

            // Process Markdown content
            if (updates.content && (updates.type === 'guide' || updates.type === 'documentation')) {
                updates.htmlContent = marked(updates.content);
            }

            const result = await this.db.collection('content').updateOne(
                { id },
                { $set: updates }
            );

            if (result.matchedCount === 0) {
                return res.status(404).json({ error: 'Content not found' });
            }

            const updatedContent = await this.db.collection('content').findOne({ id });
            res.json(updatedContent);
        } catch (error) {
            this.logger.error('Error updating content:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async deleteContent(req, res) {
        try {
            const { id } = req.params;
            const result = await this.db.collection('content').deleteOne({ id });

            if (result.deletedCount === 0) {
                return res.status(404).json({ error: 'Content not found' });
            }

            res.json({ message: 'Content deleted successfully' });
        } catch (error) {
            this.logger.error('Error deleting content:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async publishContent(req, res) {
        try {
            const { id } = req.params;
            const result = await this.db.collection('content').updateOne(
                { id },
                {
                    $set: {
                        status: 'published',
                        publishedAt: new Date(),
                        updatedAt: new Date()
                    }
                }
            );

            if (result.matchedCount === 0) {
                return res.status(404).json({ error: 'Content not found' });
            }

            res.json({ message: 'Content published successfully' });
        } catch (error) {
            this.logger.error('Error publishing content:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async unpublishContent(req, res) {
        try {
            const { id } = req.params;
            const result = await this.db.collection('content').updateOne(
                { id },
                {
                    $set: {
                        status: 'draft',
                        publishedAt: null,
                        updatedAt: new Date()
                    }
                }
            );

            if (result.matchedCount === 0) {
                return res.status(404).json({ error: 'Content not found' });
            }

            res.json({ message: 'Content unpublished successfully' });
        } catch (error) {
            this.logger.error('Error unpublishing content:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Page Management Methods
    async createPage(req, res) {
        try {
            const schema = Joi.object({
                title: Joi.string().required(),
                content: Joi.string().required(),
                slug: Joi.string(),
                template: Joi.string().default('default'),
                status: Joi.string().valid('draft', 'published').default('draft'),
                language: Joi.string().default('th'),
                meta: Joi.object({
                    description: Joi.string(),
                    keywords: Joi.array().items(Joi.string())
                })
            });

            const { error, value } = schema.validate(req.body);
            if (error) {
                return res.status(400).json({ error: error.details[0].message });
            }

            const page = {
                id: uuidv4(),
                ...value,
                slug: value.slug || slugify(value.title, { lower: true, locale: 'th' }),
                createdAt: new Date(),
                updatedAt: new Date()
            };

            await this.db.collection('pages').insertOne(page);
            res.status(201).json(page);
        } catch (error) {
            this.logger.error('Error creating page:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getPages(req, res) {
        try {
            const { status = 'published', language = 'th' } = req.query;
            const pages = await this.db.collection('pages')
                .find({ status, language })
                .sort({ createdAt: -1 })
                .toArray();

            res.json(pages);
        } catch (error) {
            this.logger.error('Error fetching pages:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getPageBySlug(req, res) {
        try {
            const { slug } = req.params;
            const { language = 'th' } = req.query;
            
            const page = await this.db.collection('pages').findOne({ 
                slug, 
                language,
                status: 'published'
            });

            if (!page) {
                return res.status(404).json({ error: 'Page not found' });
            }

            res.json(page);
        } catch (error) {
            this.logger.error('Error fetching page by slug:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Media Management Methods
    async uploadMedia(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const media = {
                id: uuidv4(),
                filename: req.file.filename,
                originalName: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                path: req.file.path,
                url: `/uploads/content/${req.file.filename}`,
                uploadedAt: new Date()
            };

            // Process image if it's an image file
            if (req.file.mimetype.startsWith('image/')) {
                try {
                    const metadata = await sharp(req.file.path).metadata();
                    media.dimensions = {
                        width: metadata.width,
                        height: metadata.height
                    };

                    // Create thumbnail
                    const thumbnailPath = req.file.path.replace(/(\.[^.]+)$/, '-thumb$1');
                    await sharp(req.file.path)
                        .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
                        .toFile(thumbnailPath);
                    
                    media.thumbnailUrl = `/uploads/content/${path.basename(thumbnailPath)}`;
                } catch (imageError) {
                    this.logger.warn('Error processing image:', imageError);
                }
            }

            await this.db.collection('media').insertOne(media);
            res.status(201).json(media);
        } catch (error) {
            this.logger.error('Error uploading media:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getMedia(req, res) {
        try {
            const { page = 1, limit = 20, type } = req.query;
            const filter = {};
            if (type) filter.mimetype = new RegExp(`^${type}/`);

            const skip = (parseInt(page) - 1) * parseInt(limit);
            const media = await this.db.collection('media')
                .find(filter)
                .sort({ uploadedAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .toArray();

            const total = await this.db.collection('media').countDocuments(filter);

            res.json({
                media,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total / parseInt(limit))
                }
            });
        } catch (error) {
            this.logger.error('Error fetching media:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GACP Specific Content Methods
    async getGACPStandards(req, res) {
        try {
            const { language = 'th' } = req.query;
            const standards = await this.db.collection('content')
                .find({
                    type: 'standard',
                    category: 'gacp',
                    language,
                    status: 'published'
                })
                .sort({ createdAt: -1 })
                .toArray();

            res.json(standards);
        } catch (error) {
            this.logger.error('Error fetching GACP standards:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getGACPGuidelines(req, res) {
        try {
            const { language = 'th' } = req.query;
            const guidelines = await this.db.collection('content')
                .find({
                    type: 'guide',
                    category: 'gacp',
                    language,
                    status: 'published'
                })
                .sort({ createdAt: -1 })
                .toArray();

            res.json(guidelines);
        } catch (error) {
            this.logger.error('Error fetching GACP guidelines:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getGACPDocumentation(req, res) {
        try {
            const { language = 'th' } = req.query;
            const documentation = await this.db.collection('content')
                .find({
                    type: 'documentation',
                    category: 'gacp',
                    language,
                    status: 'published'
                })
                .sort({ createdAt: -1 })
                .toArray();

            res.json(documentation);
        } catch (error) {
            this.logger.error('Error fetching GACP documentation:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getHerbalDatabase(req, res) {
        try {
            const { language = 'th', category = 'cannabis' } = req.query;
            const herbalContent = await this.db.collection('content')
                .find({
                    type: 'article',
                    category: `herbal-${category}`,
                    language,
                    status: 'published'
                })
                .sort({ createdAt: -1 })
                .toArray();

            res.json(herbalContent);
        } catch (error) {
            this.logger.error('Error fetching herbal database:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Search and Filter Methods
    async searchContent(req, res) {
        try {
            const { query, type, category, language = 'th' } = req.query;
            
            if (!query) {
                return res.status(400).json({ error: 'Search query is required' });
            }

            const searchFilter = {
                $and: [
                    { language },
                    { status: 'published' },
                    {
                        $or: [
                            { title: { $regex: query, $options: 'i' } },
                            { content: { $regex: query, $options: 'i' } },
                            { tags: { $in: [new RegExp(query, 'i')] } }
                        ]
                    }
                ]
            };

            if (type) searchFilter.$and.push({ type });
            if (category) searchFilter.$and.push({ category });

            const results = await this.db.collection('content')
                .find(searchFilter)
                .sort({ views: -1, createdAt: -1 })
                .limit(50)
                .toArray();

            res.json({ results, total: results.length });
        } catch (error) {
            this.logger.error('Error searching content:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getCategories(req, res) {
        try {
            const { language = 'th' } = req.query;
            const categories = await this.db.collection('content')
                .distinct('category', { language, status: 'published' });

            res.json(categories);
        } catch (error) {
            this.logger.error('Error fetching categories:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async getLanguages(req, res) {
        try {
            const languages = [
                { code: 'th', name: 'ไทย', nativeName: 'ไทย' },
                { code: 'en', name: 'English', nativeName: 'English' },
                { code: 'zh', name: 'Chinese', nativeName: '中文' },
                { code: 'my', name: 'Myanmar', nativeName: 'မြန်မာ' },
                { code: 'km', name: 'Khmer', nativeName: 'ខ្មែរ' }
            ];

            res.json(languages);
        } catch (error) {
            this.logger.error('Error fetching languages:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async connectToMongoDB() {
        try {
            const client = new MongoClient(this.mongoUrl);
            await client.connect();
            this.db = client.db(this.dbName);
            
            // Create indexes
            await this.createIndexes();
            
            this.logger.info('Connected to MongoDB');
        } catch (error) {
            this.logger.error('MongoDB connection failed:', error);
            throw error;
        }
    }

    async createIndexes() {
        try {
            // Content collection indexes
            await this.db.collection('content').createIndex({ id: 1 }, { unique: true });
            await this.db.collection('content').createIndex({ slug: 1, language: 1 });
            await this.db.collection('content').createIndex({ type: 1, category: 1, language: 1, status: 1 });
            await this.db.collection('content').createIndex({ title: 'text', content: 'text', tags: 'text' });
            await this.db.collection('content').createIndex({ createdAt: -1 });
            await this.db.collection('content').createIndex({ views: -1 });

            // Pages collection indexes
            await this.db.collection('pages').createIndex({ id: 1 }, { unique: true });
            await this.db.collection('pages').createIndex({ slug: 1, language: 1 }, { unique: true });

            // Media collection indexes
            await this.db.collection('media').createIndex({ id: 1 }, { unique: true });
            await this.db.collection('media').createIndex({ uploadedAt: -1 });

            this.logger.info('Database indexes created');
        } catch (error) {
            this.logger.error('Error creating indexes:', error);
        }
    }

    async start() {
        try {
            await this.connectToMongoDB();
            
            this.app.listen(this.port, () => {
                this.logger.info(`GACP CMS Service running on port ${this.port}`);
                this.logger.info(`Service URL: http://localhost:${this.port}`);
                this.logger.info('Available endpoints:');
                this.logger.info('  - GET /health - Health check');
                this.logger.info('  - POST /api/content - Create content');
                this.logger.info('  - GET /api/content - Get content list');
                this.logger.info('  - GET /api/gacp/standards - GACP standards');
                this.logger.info('  - GET /api/herbal/database - Herbal database');
                this.logger.info('  - POST /api/media/upload - Upload media');
                this.logger.info('  - GET /api/search - Search content');
            });
        } catch (error) {
            this.logger.error('Failed to start CMS service:', error);
            process.exit(1);
        }
    }
}

// Initialize and start the service
const cmsService = new GACPCMSService();
cmsService.start();

module.exports = GACPCMSService;