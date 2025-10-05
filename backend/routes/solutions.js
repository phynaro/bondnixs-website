const express = require('express')
const router = express.Router()

// Mock solutions data
const solutions = [
  {
    id: 1,
    title: 'Electronics Manufacturing',
    description: 'Complete dispensing solutions for electronics assembly and manufacturing',
    industry: 'Electronics',
    features: [
      'PCB assembly automation',
      'Component protection coating',
      'Precision solder paste dispensing',
      'Quality control integration'
    ],
    benefits: [
      'Increased production efficiency',
      'Reduced material waste',
      'Improved quality consistency',
      'Lower operational costs'
    ],
    applications: ['PCB Assembly', 'Component Protection', 'Solder Paste Dispensing']
  },
  {
    id: 2,
    title: 'Automotive Industry',
    description: 'Specialized solutions for automotive electronics and component manufacturing',
    industry: 'Automotive',
    features: [
      'Automotive grade materials',
      'High-volume production support',
      'Environmental compliance',
      'Durability testing'
    ],
    benefits: [
      'Automotive standard compliance',
      'High-volume production capability',
      'Environmental resistance',
      'Long-term reliability'
    ],
    applications: ['Automotive Electronics', 'Component Manufacturing', 'Quality Control']
  },
  {
    id: 3,
    title: 'Medical Device Manufacturing',
    description: 'Precision solutions for medical device assembly and packaging',
    industry: 'Medical',
    features: [
      'Clean room compatibility',
      'Biocompatible materials',
      'Regulatory compliance',
      'Traceability systems'
    ],
    benefits: [
      'Medical grade quality',
      'Regulatory compliance',
      'Biocompatible materials',
      'Full traceability'
    ],
    applications: ['Medical Device Assembly', 'Packaging', 'Quality Assurance']
  },
  {
    id: 4,
    title: 'Aerospace & Defense',
    description: 'High-reliability solutions for aerospace and defense applications',
    industry: 'Aerospace',
    features: [
      'Military grade standards',
      'Extreme environment testing',
      'Documentation compliance',
      'Long-term support'
    ],
    benefits: [
      'Military standard compliance',
      'Extreme environment resistance',
      'Comprehensive documentation',
      'Long-term support'
    ],
    applications: ['Aerospace Components', 'Defense Systems', 'High-Reliability Applications']
  }
]

const caseStudies = [
  {
    id: 1,
    title: 'Electronics Manufacturer Success Story',
    description: 'How we helped a leading electronics manufacturer increase production efficiency by 40%',
    industry: 'Electronics Manufacturing',
    results: [
      '40% increase in production efficiency',
      '60% reduction in material waste',
      '99.5% quality consistency achieved',
      'ROI achieved in 8 months'
    ],
    challenge: 'The client was struggling with manual dispensing processes that were slow, inconsistent, and prone to errors.',
    solution: 'We implemented a complete automated dispensing system with precision robots and advanced control systems.',
    outcome: 'The client achieved significant improvements in efficiency, quality, and cost savings.'
  },
  {
    id: 2,
    title: 'Automotive Supplier Optimization',
    description: 'Complete system overhaul for automotive component supplier',
    industry: 'Automotive',
    results: [
      '50% faster cycle times',
      'Zero defect rate achieved',
      '30% cost reduction',
      '24/7 production capability'
    ],
    challenge: 'The automotive supplier needed to meet strict quality standards while increasing production capacity.',
    solution: 'We designed and implemented a custom dispensing solution with advanced quality control systems.',
    outcome: 'The supplier now meets all automotive standards while operating at maximum efficiency.'
  }
]

// Get all solutions
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: solutions
  })
})

// Get solution by ID
router.get('/:id', (req, res) => {
  const { id } = req.params
  const solution = solutions.find(s => s.id === parseInt(id))
  
  if (solution) {
    res.json({
      success: true,
      data: solution
    })
  } else {
    res.status(404).json({
      success: false,
      message: 'Solution not found'
    })
  }
})

// Get solutions by industry
router.get('/industry/:industry', (req, res) => {
  const { industry } = req.params
  const industrySolutions = solutions.filter(s => 
    s.industry.toLowerCase() === industry.toLowerCase()
  )
  
  res.json({
    success: true,
    data: industrySolutions
  })
})

// Get case studies
router.get('/case-studies', (req, res) => {
  res.json({
    success: true,
    data: caseStudies
  })
})

// Get specific case study
router.get('/case-studies/:id', (req, res) => {
  const { id } = req.params
  const caseStudy = caseStudies.find(cs => cs.id === parseInt(id))
  
  if (caseStudy) {
    res.json({
      success: true,
      data: caseStudy
    })
  } else {
    res.status(404).json({
      success: false,
      message: 'Case study not found'
    })
  }
})

module.exports = router
