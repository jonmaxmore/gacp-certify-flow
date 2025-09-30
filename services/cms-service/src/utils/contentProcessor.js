const slugify = require('slugify');
const { marked } = require('marked');
const moment = require('moment');

class ContentProcessor {
    constructor() {
        this.setupMarked();
    }

    setupMarked() {
        // Configure marked for GACP documentation
        marked.setOptions({
            gfm: true,
            breaks: false,
            pedantic: false,
            sanitize: false,
            smartLists: true,
            smartypants: true,
            highlight: function(code, lang) {
                // Basic syntax highlighting for code blocks
                return `<pre><code class="language-${lang}">${code}</code></pre>`;
            }
        });

        // Custom renderer for GACP-specific elements
        const renderer = new marked.Renderer();
        
        // Custom heading renderer with auto-generated IDs
        renderer.heading = function(text, level) {
            const id = slugify(text, { lower: true, strict: true });
            return `<h${level} id="${id}" class="gacp-heading level-${level}">
                <a href="#${id}" class="anchor-link">#</a>
                ${text}
            </h${level}>`;
        };

        // Custom blockquote for GACP warnings and notes
        renderer.blockquote = function(quote) {
            if (quote.includes('[WARNING]')) {
                return `<div class="gacp-warning">${quote.replace('[WARNING]', '<strong>คำเตือน:</strong>')}</div>`;
            } else if (quote.includes('[NOTE]')) {
                return `<div class="gacp-note">${quote.replace('[NOTE]', '<strong>หมายเหตุ:</strong>')}</div>`;
            } else if (quote.includes('[IMPORTANT]')) {
                return `<div class="gacp-important">${quote.replace('[IMPORTANT]', '<strong>สำคัญ:</strong>')}</div>`;
            }
            return `<blockquote class="gacp-quote">${quote}</blockquote>`;
        };

        // Custom table renderer for GACP standards
        renderer.table = function(header, body) {
            return `<div class="gacp-table-wrapper">
                <table class="gacp-table">
                    <thead>${header}</thead>
                    <tbody>${body}</tbody>
                </table>
            </div>`;
        };

        marked.use({ renderer });
    }

    // Generate SEO-friendly slug
    generateSlug(title, language = 'th') {
        const options = {
            lower: true,
            strict: true,
            locale: language === 'th' ? 'th' : 'en'
        };

        // Handle Thai text
        if (language === 'th') {
            // Basic Thai romanization for slug generation
            const thaiToRoman = {
                'ก': 'k', 'ข': 'kh', 'ค': 'kh', 'ง': 'ng',
                'จ': 'j', 'ฉ': 'ch', 'ช': 'ch', 'ซ': 's', 'ญ': 'y',
                'ด': 'd', 'ต': 't', 'ถ': 'th', 'ท': 'th', 'ธ': 'th',
                'น': 'n', 'บ': 'b', 'ป': 'p', 'ผ': 'ph', 'ฝ': 'f',
                'พ': 'ph', 'ฟ': 'f', 'ภ': 'ph', 'ม': 'm', 'ย': 'y',
                'ร': 'r', 'ล': 'l', 'ว': 'w', 'ส': 's', 'ห': 'h',
                'อ': 'o', 'ฮ': 'h'
            };

            let romanized = title;
            Object.keys(thaiToRoman).forEach(thai => {
                romanized = romanized.replace(new RegExp(thai, 'g'), thaiToRoman[thai]);
            });
            
            return slugify(romanized, options);
        }

        return slugify(title, options);
    }

    // Process content for different types
    processContent(content, type, language = 'th') {
        let processed = {
            html: '',
            excerpt: '',
            readingTime: 0,
            wordCount: 0,
            headings: []
        };

        try {
            // Generate HTML from Markdown
            processed.html = marked(content);

            // Calculate reading time (200 words per minute for Thai, 250 for English)
            const wordsPerMinute = language === 'th' ? 200 : 250;
            processed.wordCount = this.countWords(content, language);
            processed.readingTime = Math.ceil(processed.wordCount / wordsPerMinute);

            // Extract headings for table of contents
            processed.headings = this.extractHeadings(content);

            // Generate excerpt
            processed.excerpt = this.generateExcerpt(content, 300);

            // Type-specific processing
            switch (type) {
                case 'standard':
                    processed = this.processStandardContent(processed, content);
                    break;
                case 'guide':
                    processed = this.processGuideContent(processed, content);
                    break;
                case 'documentation':
                    processed = this.processDocumentationContent(processed, content);
                    break;
                default:
                    break;
            }

        } catch (error) {
            // Use console.warn instead of console.error for non-critical processing errors
            console.warn('Warning: Error processing content:', error.message);
        }

        return processed;
    }

    // Count words based on language
    countWords(text, language = 'th') {
        if (language === 'th') {
            // Thai text doesn't use spaces, so count characters instead
            const cleanText = text.replace(/[^\u0E00-\u0E7F]/g, '');
            return Math.ceil(cleanText.length / 6); // Average Thai word is ~6 characters
        } else {
            // English and other space-separated languages
            return text.trim().split(/\s+/).length;
        }
    }

    // Extract headings for table of contents
    extractHeadings(content) {
        const headings = [];
        const headingRegex = /^(#{1,6})\s+(.+)$/gm;
        let match;

        while ((match = headingRegex.exec(content)) !== null) {
            const level = match[1].length;
            const text = match[2].trim();
            const id = this.generateSlug(text);

            headings.push({
                level,
                text,
                id,
                children: []
            });
        }

        return this.buildHeadingHierarchy(headings);
    }

    // Build hierarchical structure for headings
    buildHeadingHierarchy(headings) {
        const hierarchy = [];
        const stack = [];

        headings.forEach(heading => {
            // Pop items from stack until we find a parent
            while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
                stack.pop();
            }

            if (stack.length === 0) {
                hierarchy.push(heading);
            } else {
                stack[stack.length - 1].children.push(heading);
            }

            stack.push(heading);
        });

        return hierarchy;
    }

    // Generate excerpt from content
    generateExcerpt(content, maxLength = 300) {
        // Remove markdown formatting
        let excerpt = content
            .replace(/#{1,6}\s+/g, '') // Remove headings
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
            .replace(/\*(.*?)\*/g, '$1') // Remove italic
            .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links
            .replace(/```[\s\S]*?```/g, '') // Remove code blocks
            .replace(/`(.*?)`/g, '$1') // Remove inline code
            .replace(/^\s*[-*+]\s+/gm, '') // Remove list markers
            .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered list markers
            .trim();

        if (excerpt.length > maxLength) {
            excerpt = excerpt.substring(0, maxLength).trim();
            // Don't cut words in the middle
            const lastSpace = excerpt.lastIndexOf(' ');
            if (lastSpace > maxLength * 0.8) {
                excerpt = excerpt.substring(0, lastSpace);
            }
            excerpt += '...';
        }

        return excerpt;
    }

    // Process GACP standard content
    processStandardContent(processed, content) {
        // Extract standard-specific metadata
        const versionMatch = content.match(/Version:\s*([^\n]+)/i);
        const effectiveDateMatch = content.match(/Effective Date:\s*([^\n]+)/i);
        const scopeMatch = content.match(/## Scope\s*\n(.*?)(?=\n##|\n$)/s);

        processed.metadata = {
            version: versionMatch ? versionMatch[1].trim() : null,
            effectiveDate: effectiveDateMatch ? effectiveDateMatch[1].trim() : null,
            scope: scopeMatch ? scopeMatch[1].trim() : null,
            complianceLevel: 'mandatory'
        };

        // Add standard-specific CSS classes
        processed.html = processed.html.replace(
            /<h2>/g,
            '<h2 class="gacp-standard-section">'
        );

        return processed;
    }

    // Process GACP guide content
    processGuideContent(processed, content) {
        // Extract guide-specific metadata
        const difficultyMatch = content.match(/Difficulty:\s*([^\n]+)/i);
        const audienceMatch = content.match(/Target Audience:\s*([^\n]+)/i);
        const timeMatch = content.match(/Estimated Time:\s*([^\n]+)/i);

        processed.metadata = {
            difficulty: difficultyMatch ? difficultyMatch[1].trim() : 'intermediate',
            targetAudience: audienceMatch ? audienceMatch[1].trim().split(',').map(s => s.trim()) : [],
            estimatedTime: timeMatch ? timeMatch[1].trim() : null,
            complianceLevel: 'recommended'
        };

        // Add step numbering to guides
        processed.html = this.addStepNumbering(processed.html);

        return processed;
    }

    // Process documentation content
    processDocumentationContent(processed, content) {
        // Extract documentation-specific metadata
        const processOwnerMatch = content.match(/Process Owner:\s*([^\n]+)/i);
        const lastUpdatedMatch = content.match(/Last Updated:\s*([^\n]+)/i);

        processed.metadata = {
            processOwner: processOwnerMatch ? processOwnerMatch[1].trim() : null,
            lastUpdated: lastUpdatedMatch ? lastUpdatedMatch[1].trim() : null,
            complianceLevel: 'informational'
        };

        return processed;
    }

    // Add step numbering to guide content
    addStepNumbering(html) {
        let stepCounter = 0;
        return html.replace(/<h3[^>]*>(.*?)<\/h3>/g, (match, content) => {
            if (content.toLowerCase().includes('step') || content.toLowerCase().includes('ขั้นตอน')) {
                stepCounter++;
                return match.replace(content, `ขั้นตอนที่ ${stepCounter}: ${content}`);
            }
            return match;
        });
    }

    // Generate structured data for SEO
    generateStructuredData(content, type) {
        const baseStructure = {
            "@context": "https://schema.org",
            "@type": this.getSchemaType(type),
            "name": content.title,
            "description": content.excerpt,
            "url": `${process.env.SITE_URL || 'https://gacp.go.th'}/content/${content.slug}`,
            "dateCreated": content.createdAt,
            "dateModified": content.updatedAt,
            "author": {
                "@type": "Organization",
                "name": "กรมวิชาการเกษตร"
            },
            "inLanguage": content.language
        };

        if (content.featuredImage) {
            baseStructure.image = content.featuredImage;
        }

        if (type === 'standard') {
            baseStructure["@type"] = "TechArticle";
            baseStructure.about = "GACP Standards";
            baseStructure.audience = "Agricultural Professionals";
        }

        return baseStructure;
    }

    // Get Schema.org type based on content type
    getSchemaType(type) {
        const typeMap = {
            'article': 'Article',
            'guide': 'HowTo',
            'standard': 'TechArticle',
            'documentation': 'TechArticle',
            'faq': 'FAQPage',
            'news': 'NewsArticle'
        };
        return typeMap[type] || 'Article';
    }

    // Validate content structure for GACP compliance
    validateGACPContent(content, type) {
        const errors = [];
        const warnings = [];

        // Common validations
        if (!content.title || content.title.length < 10) {
            errors.push('Title must be at least 10 characters long');
        }

        if (!content.content || content.content.length < 100) {
            errors.push('Content must be at least 100 characters long');
        }

        if (!content.category) {
            errors.push('Category is required');
        }

        // Type-specific validations
        switch (type) {
            case 'standard':
                if (!content.content.includes('## Scope')) {
                    warnings.push('GACP standards should include a Scope section');
                }
                if (!content.content.includes('## Requirements')) {
                    warnings.push('GACP standards should include a Requirements section');
                }
                break;

            case 'guide':
                if (!content.content.includes('step') && !content.content.includes('ขั้นตอน')) {
                    warnings.push('Guides should include step-by-step instructions');
                }
                break;

            case 'documentation':
                if (!content.content.includes('## Purpose') && !content.content.includes('## วัตถุประสงค์')) {
                    warnings.push('Documentation should include a Purpose section');
                }
                break;
        }

        return { errors, warnings, isValid: errors.length === 0 };
    }

    // Format date for Thai locale
    formatThaiDate(date) {
        moment.locale('th');
        return moment(date).format('D MMMM YYYY');
    }

    // Convert between Thai and Gregorian calendar
    convertToThaiYear(date) {
        const gregorianYear = new Date(date).getFullYear();
        return gregorianYear + 543;
    }

    // Generate content analytics
    generateContentAnalytics(content) {
        const analytics = {
            wordCount: this.countWords(content.content, content.language),
            readingTime: 0,
            sentiment: 'neutral',
            complexity: 'medium',
            topics: [],
            keywords: []
        };

        // Calculate reading time
        const wordsPerMinute = content.language === 'th' ? 200 : 250;
        analytics.readingTime = Math.ceil(analytics.wordCount / wordsPerMinute);

        // Basic keyword extraction (simplified)
        const words = content.content.toLowerCase().split(/\s+/);
        const wordFreq = {};
        
        words.forEach(word => {
            if (word.length > 3) {
                wordFreq[word] = (wordFreq[word] || 0) + 1;
            }
        });

        analytics.keywords = Object.entries(wordFreq)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([word]) => word);

        return analytics;
    }
}

module.exports = ContentProcessor;