const Joi = require('joi');

// Content Schema
const ContentSchema = Joi.object({
    id: Joi.string().uuid().required(),
    title: Joi.string().min(1).max(500).required(),
    content: Joi.string().required(),
    type: Joi.string().valid(
        'article',
        'page', 
        'guide',
        'standard',
        'documentation',
        'faq',
        'news',
        'announcement'
    ).required(),
    category: Joi.string().valid(
        'gacp',
        'herbal-cannabis',
        'herbal-traditional',
        'certification',
        'compliance',
        'training',
        'research',
        'guidelines',
        'regulations',
        'best-practices'
    ).required(),
    slug: Joi.string().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).required(),
    tags: Joi.array().items(Joi.string()).default([]),
    language: Joi.string().valid('th', 'en', 'zh', 'my', 'km').default('th'),
    status: Joi.string().valid('draft', 'review', 'published', 'archived').default('draft'),
    author: Joi.string().required(),
    editor: Joi.string().optional(),
    reviewer: Joi.string().optional(),
    
    // Content metadata
    meta: Joi.object({
        description: Joi.string().max(500),
        keywords: Joi.array().items(Joi.string()),
        canonicalUrl: Joi.string().uri(),
        readingTime: Joi.number().min(0),
        difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced'),
        target_audience: Joi.array().items(Joi.string().valid(
            'farmers', 'inspectors', 'manufacturers', 'exporters', 'researchers', 'students'
        ))
    }).default({}),

    // SEO metadata
    seo: Joi.object({
        title: Joi.string().max(60),
        description: Joi.string().max(160),
        keywords: Joi.string(),
        ogImage: Joi.string().uri(),
        twitterCard: Joi.string().valid('summary', 'summary_large_image'),
        structuredData: Joi.object()
    }).default({}),

    // Content structure
    htmlContent: Joi.string().optional(),
    excerpt: Joi.string().max(300).optional(),
    featuredImage: Joi.string().uri().optional(),
    gallery: Joi.array().items(Joi.string().uri()).default([]),
    attachments: Joi.array().items(Joi.object({
        id: Joi.string().uuid(),
        filename: Joi.string(),
        url: Joi.string().uri(),
        size: Joi.number(),
        type: Joi.string()
    })).default([]),

    // Publishing information
    publishedAt: Joi.date().iso().optional(),
    scheduledAt: Joi.date().iso().optional(),
    expiredAt: Joi.date().iso().optional(),
    
    // Analytics
    views: Joi.number().min(0).default(0),
    likes: Joi.number().min(0).default(0),
    shares: Joi.number().min(0).default(0),
    downloads: Joi.number().min(0).default(0),

    // Versioning
    version: Joi.number().min(1).default(1),
    parentId: Joi.string().uuid().optional(),
    revisionHistory: Joi.array().items(Joi.object({
        version: Joi.number(),
        timestamp: Joi.date().iso(),
        author: Joi.string(),
        changes: Joi.string()
    })).default([]),

    // Timestamps
    createdAt: Joi.date().iso().required(),
    updatedAt: Joi.date().iso().required()
});

// Page Schema
const PageSchema = Joi.object({
    id: Joi.string().uuid().required(),
    title: Joi.string().min(1).max(500).required(),
    content: Joi.string().required(),
    slug: Joi.string().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).required(),
    template: Joi.string().valid(
        'default',
        'landing',
        'documentation',
        'gallery',
        'form',
        'dashboard'
    ).default('default'),
    status: Joi.string().valid('draft', 'published', 'private').default('draft'),
    language: Joi.string().valid('th', 'en', 'zh', 'my', 'km').default('th'),
    
    // Page hierarchy
    parentId: Joi.string().uuid().optional(),
    sortOrder: Joi.number().min(0).default(0),
    
    // Page metadata
    meta: Joi.object({
        description: Joi.string().max(500),
        keywords: Joi.array().items(Joi.string()),
        robots: Joi.string().valid('index,follow', 'noindex,nofollow', 'index,nofollow', 'noindex,follow')
    }).default({}),

    // Access control
    accessLevel: Joi.string().valid('public', 'members', 'admin').default('public'),
    requiredRole: Joi.string().optional(),

    // Timestamps
    createdAt: Joi.date().iso().required(),
    updatedAt: Joi.date().iso().required()
});

// Menu Schema
const MenuSchema = Joi.object({
    id: Joi.string().uuid().required(),
    name: Joi.string().required(),
    label: Joi.string().required(),
    language: Joi.string().valid('th', 'en', 'zh', 'my', 'km').default('th'),
    location: Joi.string().valid('header', 'footer', 'sidebar', 'mobile').default('header'),
    status: Joi.string().valid('active', 'inactive').default('active'),
    
    items: Joi.array().items(Joi.object({
        id: Joi.string().uuid(),
        label: Joi.string().required(),
        url: Joi.string().uri().optional(),
        type: Joi.string().valid('page', 'content', 'external', 'category').required(),
        target: Joi.string().valid('_self', '_blank').default('_self'),
        icon: Joi.string().optional(),
        sortOrder: Joi.number().min(0).default(0),
        parentId: Joi.string().uuid().optional(),
        children: Joi.array().items(Joi.link('...'))
    })).default([]),

    // Timestamps
    createdAt: Joi.date().iso().required(),
    updatedAt: Joi.date().iso().required()
});

// Media Schema
const MediaSchema = Joi.object({
    id: Joi.string().uuid().required(),
    filename: Joi.string().required(),
    originalName: Joi.string().required(),
    mimetype: Joi.string().required(),
    size: Joi.number().min(0).required(),
    path: Joi.string().required(),
    url: Joi.string().uri().required(),
    thumbnailUrl: Joi.string().uri().optional(),
    
    // Image specific
    dimensions: Joi.object({
        width: Joi.number().min(0),
        height: Joi.number().min(0)
    }).optional(),
    
    // File metadata
    alt: Joi.string().max(200).optional(),
    caption: Joi.string().max(500).optional(),
    title: Joi.string().max(200).optional(),
    description: Joi.string().max(1000).optional(),
    
    // Organization
    folder: Joi.string().default('general'),
    tags: Joi.array().items(Joi.string()).default([]),
    
    // Usage tracking
    usageCount: Joi.number().min(0).default(0),
    lastUsed: Joi.date().iso().optional(),
    
    // Timestamps
    uploadedAt: Joi.date().iso().required(),
    updatedAt: Joi.date().iso().optional()
});

// Translation Schema
const TranslationSchema = Joi.object({
    id: Joi.string().uuid().required(),
    contentId: Joi.string().uuid().required(),
    sourceLanguage: Joi.string().valid('th', 'en', 'zh', 'my', 'km').required(),
    targetLanguage: Joi.string().valid('th', 'en', 'zh', 'my', 'km').required(),
    
    translations: Joi.object({
        title: Joi.string().optional(),
        content: Joi.string().optional(),
        excerpt: Joi.string().optional(),
        meta: Joi.object({
            description: Joi.string(),
            keywords: Joi.array().items(Joi.string())
        }).optional(),
        seo: Joi.object({
            title: Joi.string(),
            description: Joi.string(),
            keywords: Joi.string()
        }).optional()
    }).required(),
    
    // Translation metadata
    translator: Joi.string().required(),
    translationMethod: Joi.string().valid('human', 'machine', 'hybrid').required(),
    quality: Joi.string().valid('draft', 'review', 'approved').default('draft'),
    confidence: Joi.number().min(0).max(1).optional(),
    
    // Timestamps
    createdAt: Joi.date().iso().required(),
    updatedAt: Joi.date().iso().required()
});

// Category Schema
const CategorySchema = Joi.object({
    id: Joi.string().uuid().required(),
    name: Joi.string().required(),
    slug: Joi.string().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).required(),
    description: Joi.string().optional(),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
    icon: Joi.string().optional(),
    
    // Hierarchy
    parentId: Joi.string().uuid().optional(),
    level: Joi.number().min(0).default(0),
    sortOrder: Joi.number().min(0).default(0),
    
    // Settings
    isVisible: Joi.boolean().default(true),
    requiresAuth: Joi.boolean().default(false),
    
    // Timestamps
    createdAt: Joi.date().iso().required(),
    updatedAt: Joi.date().iso().required()
});

// GACP Content Templates
const GACPContentTemplates = {
    standard: {
        sections: [
            'introduction',
            'scope',
            'definitions',
            'requirements',
            'implementation',
            'verification',
            'documentation',
            'references'
        ],
        required_fields: ['version', 'effective_date', 'review_date'],
        compliance_level: 'mandatory'
    },
    
    guideline: {
        sections: [
            'overview',
            'background',
            'step_by_step',
            'examples',
            'best_practices',
            'common_mistakes',
            'resources'
        ],
        required_fields: ['target_audience', 'difficulty_level'],
        compliance_level: 'recommended'
    },
    
    documentation: {
        sections: [
            'purpose',
            'procedure',
            'requirements',
            'forms',
            'timeline',
            'contacts'
        ],
        required_fields: ['process_owner', 'last_updated'],
        compliance_level: 'informational'
    }
};

// Herbal Database Content Structure
const HerbalContentStructure = {
    cannabis: {
        required_fields: [
            'scientific_name',
            'common_names',
            'plant_family',
            'cultivation_zones',
            'harvest_season',
            'active_compounds',
            'medicinal_properties',
            'usage_instructions',
            'safety_warnings',
            'legal_status'
        ],
        optional_fields: [
            'traditional_uses',
            'research_studies',
            'cultivation_tips',
            'processing_methods',
            'quality_standards',
            'export_requirements'
        ]
    },
    
    traditional_herbs: {
        required_fields: [
            'scientific_name',
            'thai_name',
            'plant_family',
            'plant_parts_used',
            'traditional_properties',
            'preparation_methods',
            'dosage_forms',
            'contraindications'
        ],
        optional_fields: [
            'historical_use',
            'modern_research',
            'cultivation_areas',
            'harvest_guidelines',
            'quality_markers',
            'regulatory_status'
        ]
    }
};

module.exports = {
    ContentSchema,
    PageSchema,
    MenuSchema,
    MediaSchema,
    TranslationSchema,
    CategorySchema,
    GACPContentTemplates,
    HerbalContentStructure
};