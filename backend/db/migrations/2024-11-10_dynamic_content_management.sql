-- Dynamic Content Management System Migration
-- Creates tables for managing dynamic content on all website pages

-- Create home_content table
CREATE TABLE IF NOT EXISTS home_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_type TEXT NOT NULL CHECK (section_type IN ('hero', 'feature', 'product_preview', 'cta')),
  title TEXT,
  subtitle TEXT,
  description TEXT,
  content JSONB, -- Flexible JSON for section-specific data
  display_order INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create solutions_content table
CREATE TABLE IF NOT EXISTS solutions_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('industry_solution', 'case_study', 'process_step', 'benefit', 'hero', 'cta')),
  title TEXT,
  description TEXT,
  content JSONB, -- Features array, results array, etc.
  display_order INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create about_content table
CREATE TABLE IF NOT EXISTS about_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_type TEXT NOT NULL CHECK (section_type IN ('hero', 'story', 'value', 'stat', 'commitment_item')),
  title TEXT,
  description TEXT,
  content JSONB, -- Stats values, commitment details, etc.
  display_order INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create contact_faq table
CREATE TABLE IF NOT EXISTS contact_faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_home_content_section_type ON home_content(section_type);
CREATE INDEX IF NOT EXISTS idx_home_content_display_order ON home_content(display_order);
CREATE INDEX IF NOT EXISTS idx_home_content_published ON home_content(published);

CREATE INDEX IF NOT EXISTS idx_solutions_content_type ON solutions_content(content_type);
CREATE INDEX IF NOT EXISTS idx_solutions_content_display_order ON solutions_content(display_order);
CREATE INDEX IF NOT EXISTS idx_solutions_content_published ON solutions_content(published);

CREATE INDEX IF NOT EXISTS idx_about_content_section_type ON about_content(section_type);
CREATE INDEX IF NOT EXISTS idx_about_content_display_order ON about_content(display_order);
CREATE INDEX IF NOT EXISTS idx_about_content_published ON about_content(published);

CREATE INDEX IF NOT EXISTS idx_contact_faq_display_order ON contact_faq(display_order);
CREATE INDEX IF NOT EXISTS idx_contact_faq_published ON contact_faq(published);

-- Seed data for home_content (hero section)
INSERT INTO home_content (section_type, title, subtitle, description, content, display_order, published)
VALUES (
  'hero',
  'Founded by Dispensing Expert Engineers',
  'BONDNIXS CO., LTD. is a specialized engineering and distribution company founded by dispensing expert engineers focusing on desktop robot and dispensing solutions.',
  NULL,
  '{"cta_primary": {"text": "Contact Us", "link": "/contact"}, "cta_secondary": {"text": "Learn More", "link": "/products"}}'::jsonb,
  1,
  true
) ON CONFLICT DO NOTHING;

-- Seed data for home_content (features)
INSERT INTO home_content (section_type, title, subtitle, description, content, display_order, published)
VALUES 
  (
    'feature',
    'Why Choose BONDNIXS?',
    'With over 10 years of experience in electronics field, we provide a one-stop solution from system design to after-sales service.',
    'Powered by Taiwan Technology',
    '{"description": "Backed by Taiwan''s strong foundation as the world''s leading electronics manufacturer"}'::jsonb,
    1,
    true
  ),
  (
    'feature',
    NULL,
    NULL,
    'Proven OEM Partner',
    '{"description": "We provide robots and dispensing systems as an OEM partner for leading international brands"}'::jsonb,
    2,
    true
  ),
  (
    'feature',
    NULL,
    NULL,
    'Expert Engineering Team',
    '{"description": "Expert dispensing engineering delivering reliable solutions and technical support"}'::jsonb,
    3,
    true
  ),
  (
    'feature',
    NULL,
    NULL,
    'Cost-Effective Solutions',
    '{"description": "From sales and system design to installation and service, we offer complete value-driven solutions"}'::jsonb,
    4,
    true
  ) ON CONFLICT DO NOTHING;

-- Seed data for home_content (product previews)
INSERT INTO home_content (section_type, title, subtitle, description, content, display_order, published)
VALUES 
  (
    'product_preview',
    'Our Products & Services',
    'Comprehensive range of desktop robots, dispensing controllers, valves, and accessories for all your automation needs.',
    'Desktop Robots',
    '{"description": "DT-FN, DT-200T, DT-ST series and more advanced dispensing robots for precision automation.", "link": "/products", "linkText": "View All Robots →", "gradient": "from-primary-400 to-primary-600"}'::jsonb,
    1,
    true
  ),
  (
    'product_preview',
    NULL,
    NULL,
    'Dispensing Controllers',
    '{"description": "6000E, 9000F, 8000D series and advanced micro-processor digital dispensers.", "link": "/products", "linkText": "View Controllers →", "gradient": "from-secondary-400 to-secondary-600"}'::jsonb,
    2,
    true
  ),
  (
    'product_preview',
    NULL,
    NULL,
    'Engineering Services',
    '{"description": "System design, installation, testing, troubleshooting, and comprehensive after-sales support.", "link": "/solutions", "linkText": "Learn More →", "gradient": "from-primary-400 to-secondary-600"}'::jsonb,
    3,
    true
  ) ON CONFLICT DO NOTHING;

-- Seed data for solutions_content (hero)
INSERT INTO solutions_content (content_type, title, description, content, display_order, published)
VALUES (
  'hero',
  'Industry Solutions',
  'Tailored dispensing solutions for various industries and applications',
  NULL,
  1,
  true
) ON CONFLICT DO NOTHING;

-- Seed data for solutions_content (industry solutions)
INSERT INTO solutions_content (content_type, title, description, content, display_order, published)
VALUES 
  (
    'industry_solution',
    'Electronics Manufacturing',
    'Complete dispensing solutions for electronics assembly and manufacturing',
    '{"features": ["PCB assembly automation", "Component protection coating", "Precision solder paste dispensing", "Quality control integration"]}'::jsonb,
    1,
    true
  ),
  (
    'industry_solution',
    'Automotive Industry',
    'Specialized solutions for automotive electronics and component manufacturing',
    '{"features": ["Automotive grade materials", "High-volume production support", "Environmental compliance", "Durability testing"]}'::jsonb,
    2,
    true
  ),
  (
    'industry_solution',
    'Medical Device Manufacturing',
    'Precision solutions for medical device assembly and packaging',
    '{"features": ["Clean room compatibility", "Biocompatible materials", "Regulatory compliance", "Traceability systems"]}'::jsonb,
    3,
    true
  ),
  (
    'industry_solution',
    'Aerospace & Defense',
    'High-reliability solutions for aerospace and defense applications',
    '{"features": ["Military grade standards", "Extreme environment testing", "Documentation compliance", "Long-term support"]}'::jsonb,
    4,
    true
  ) ON CONFLICT DO NOTHING;

-- Seed data for solutions_content (case studies)
INSERT INTO solutions_content (content_type, title, description, content, display_order, published)
VALUES 
  (
    'case_study',
    'Electronics Manufacturer Success Story',
    'How we helped a leading electronics manufacturer increase production efficiency by 40%',
    '{"industry": "Electronics Manufacturing", "results": ["40% increase in production efficiency", "60% reduction in material waste", "99.5% quality consistency achieved", "ROI achieved in 8 months"]}'::jsonb,
    1,
    true
  ),
  (
    'case_study',
    'Automotive Supplier Optimization',
    'Complete system overhaul for automotive component supplier',
    '{"industry": "Automotive", "results": ["50% faster cycle times", "Zero defect rate achieved", "30% cost reduction", "24/7 production capability"]}'::jsonb,
    2,
    true
  ) ON CONFLICT DO NOTHING;

-- Seed data for solutions_content (process steps)
INSERT INTO solutions_content (content_type, title, description, content, display_order, published)
VALUES 
  (
    'process_step',
    'Consultation',
    'Understanding your requirements and challenges',
    '{"step": "01"}'::jsonb,
    1,
    true
  ),
  (
    'process_step',
    'Design',
    'Creating customized solutions and system design',
    '{"step": "02"}'::jsonb,
    2,
    true
  ),
  (
    'process_step',
    'Implementation',
    'Installation, testing, and system integration',
    '{"step": "03"}'::jsonb,
    3,
    true
  ),
  (
    'process_step',
    'Support',
    'Ongoing maintenance and technical support',
    '{"step": "04"}'::jsonb,
    4,
    true
  ) ON CONFLICT DO NOTHING;

-- Seed data for solutions_content (benefits)
INSERT INTO solutions_content (content_type, title, description, content, display_order, published)
VALUES 
  (
    'benefit',
    'Increased Efficiency',
    'Optimize your production processes and reduce cycle times with our advanced automation solutions',
    NULL,
    1,
    true
  ),
  (
    'benefit',
    'Quality Assurance',
    'Ensure consistent quality and reduce defects with precision dispensing and automated quality control',
    NULL,
    2,
    true
  ),
  (
    'benefit',
    'Cost Reduction',
    'Reduce material waste, labor costs, and downtime with efficient automation and optimized processes',
    NULL,
    3,
    true
  ) ON CONFLICT DO NOTHING;

-- Seed data for about_content (hero)
INSERT INTO about_content (section_type, title, description, content, display_order, published)
VALUES (
  'hero',
  'About BONDNIXS',
  'Specialized engineering and distribution company founded by dispensing expert engineers',
  NULL,
  1,
  true
) ON CONFLICT DO NOTHING;

-- Seed data for about_content (story)
INSERT INTO about_content (section_type, title, description, content, display_order, published)
VALUES 
  (
    'story',
    'Our Story',
    'BONDNIXS CO., LTD. is a specialized engineering and distribution company founded by dispensing expert engineers focusing on desktop robot and dispensing solutions.',
    '{"paragraphs": ["With over 10 years of experience in electronics field, we can provide a one-stop solution – from system design, machine configuration, installation, testing and troubleshooting to after-sales service and spare parts support.", "We are committed to delivering reliable, high-quality engineering solutions that add value to our customers'' operations."]}'::jsonb,
    1,
    true
  ) ON CONFLICT DO NOTHING;

-- Seed data for about_content (values)
INSERT INTO about_content (section_type, title, description, content, display_order, published)
VALUES 
  (
    'value',
    'Powered by Taiwan Technology',
    'Backed by Taiwan''s strong foundation as the world''s leading electronics manufacturer',
    NULL,
    1,
    true
  ),
  (
    'value',
    'Proven OEM Partner',
    'We provide robots and dispensing systems as an OEM partner for several leading international brands especially USA and Europe brands',
    NULL,
    2,
    true
  ),
  (
    'value',
    'Expert Engineering Team',
    'Expert dispensing engineering delivering reliable solutions and technical support',
    NULL,
    3,
    true
  ),
  (
    'value',
    'Cost-Effective & One-Stop Solution',
    'From sales and system design to installation and service, we offer complete and value-driven solutions',
    NULL,
    4,
    true
  ) ON CONFLICT DO NOTHING;

-- Seed data for about_content (stats)
INSERT INTO about_content (section_type, title, description, content, display_order, published)
VALUES 
  (
    'stat',
    '10+',
    'Years of Experience',
    NULL,
    1,
    true
  ),
  (
    'stat',
    '100+',
    'Projects Completed',
    NULL,
    2,
    true
  ),
  (
    'stat',
    '50+',
    'Happy Clients',
    NULL,
    3,
    true
  ) ON CONFLICT DO NOTHING;

-- Seed data for about_content (commitment items)
INSERT INTO about_content (section_type, title, description, content, display_order, published)
VALUES 
  (
    'commitment_item',
    'Quality Assurance',
    'Rigorous testing and quality control processes ensure reliable performance',
    NULL,
    1,
    true
  ),
  (
    'commitment_item',
    'Technical Support',
    'Comprehensive after-sales service and technical support',
    NULL,
    2,
    true
  ),
  (
    'commitment_item',
    'Custom Solutions',
    'Tailored solutions to meet specific customer requirements',
    NULL,
    3,
    true
  ),
  (
    'commitment_item',
    'Global Reach',
    'Serving customers worldwide with local support',
    NULL,
    4,
    true
  ) ON CONFLICT DO NOTHING;

-- Seed data for contact_faq
INSERT INTO contact_faq (question, answer, display_order, published)
VALUES 
  (
    'What types of dispensing applications do you support?',
    'We support a wide range of applications including potting, conformal coating, solder paste dispensing, and custom applications. Our solutions are designed for electronics, automotive, medical device, and aerospace industries.',
    1,
    true
  ),
  (
    'Do you provide installation and training services?',
    'Yes, we provide comprehensive installation, testing, and training services. Our expert team ensures proper system setup and provides training for your operators to maximize system efficiency.',
    2,
    true
  ),
  (
    'What kind of after-sales support do you offer?',
    'We offer comprehensive after-sales support including maintenance, troubleshooting, system upgrades, and spare parts supply. Our technical support team is available to assist with any issues.',
    3,
    true
  ),
  (
    'Can you customize solutions for specific requirements?',
    'Absolutely. We specialize in custom solutions and can modify our standard products or create entirely new systems to meet your specific requirements and applications.',
    4,
    true
  ) ON CONFLICT DO NOTHING;

