const express = require('express')
const router = express.Router()

// Mock product data
const products = {
  desktopRobots: [
    { id: 1, name: 'DT-FN series Desktop Dispensing Robot', description: 'High-precision desktop dispensing robot' },
    { id: 2, name: 'DT-200T 3-Axis Dispensing Robot', description: '3-axis precision dispensing system' },
    { id: 3, name: 'DT-ST series DESKTOP DISPENSING ROBOT', description: 'Advanced desktop dispensing solution' },
    { id: 4, name: 'DT-500GS Gantry Dispensing Robot', description: 'Gantry-style dispensing robot' },
    { id: 5, name: 'DT-Q series Costdown Robot', description: 'Cost-effective dispensing robot' },
    { id: 6, name: 'DT-500Q2Y Dual Tables Dispensing Robot', description: 'Dual table dispensing system' },
    { id: 7, name: 'DT-LV series Lan Smart Vision Robot', description: 'Vision-guided dispensing robot' },
    { id: 8, name: 'DT-GS series Gantry Dispensing Robot', description: 'Gantry dispensing system' },
    { id: 9, name: 'DT-DIY series 3-Axis Dispensing Robot', description: 'DIY 3-axis dispensing robot' },
    { id: 10, name: 'DT-HR series NEW! 4-axis Dispensing Robot', description: 'Latest 4-axis dispensing robot' },
    { id: 11, name: 'DT-ST-LV series AUTO ALIGNMENT SYSTEM ROBOT', description: 'Auto alignment dispensing system' },
    { id: 12, name: 'DT-GLV series H Shape Auto Alignment System Robot', description: 'H-shape auto alignment robot' }
  ],
  controllers: [
    { id: 1, name: '6000E-Standard Dispenser', description: 'Standard dispensing controller' },
    { id: 2, name: '9000F Micro-pressing Processor Digital Dispenser', description: 'Micro-pressing digital dispenser' },
    { id: 3, name: '8000D-Micro Processor Dispenser', description: 'Micro processor dispenser' },
    { id: 4, name: 'RT-100 Peristaltic Glue Dispenser', description: 'Peristaltic glue dispensing system' },
    { id: 5, name: '9000E-Micro Processor Digital Dispenser', description: 'Advanced micro processor dispenser' },
    { id: 6, name: 'SP-1000 Syringe Pump Dispenser', description: 'Syringe pump dispensing system' },
    { id: 7, name: 'VC-1000 Valve Controller', description: 'Precision valve controller' },
    { id: 8, name: 'AVC-2100 Auger Valve Controller', description: 'Auger valve control system' }
  ],
  valves: [
    { id: 1, name: 'DV-300T-Diaphragm Valve', description: 'Diaphragm dispensing valve' },
    { id: 2, name: 'DV-500-Needle Off Spray Valve', description: 'Needle off spray valve' },
    { id: 3, name: 'DV-303-Suck-Back Valve', description: 'Suck-back dispensing valve' },
    { id: 4, name: 'DV-500T- Conformal Coating Valve', description: 'Conformal coating valve' },
    { id: 5, name: 'DV-386-Needle Off Valve', description: 'Needle off valve' },
    { id: 6, name: 'PDV-7100 Precision auger valve', description: 'Precision auger valve' }
  ],
  accessories: [
    { id: 1, name: 'Needles and Tips', description: 'Various dispensing needles and tips' },
    { id: 2, name: 'Syringes and Pistons', description: 'Dispensing syringes and pistons' }
  ]
}

// Get all products
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: products
  })
})

// Get products by category
router.get('/:category', (req, res) => {
  const { category } = req.params
  // Convert kebab-case to camelCase
  const categoryKey = category.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
  
  if (products[categoryKey]) {
    res.json({
      success: true,
      data: products[categoryKey]
    })
  } else {
    res.status(404).json({
      success: false,
      message: 'Category not found'
    })
  }
})

// Get specific product
router.get('/:category/:id', (req, res) => {
  const { category, id } = req.params
  // Convert kebab-case to camelCase
  const categoryKey = category.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
  
  if (products[categoryKey]) {
    const product = products[categoryKey].find(p => p.id === parseInt(id))
    if (product) {
      res.json({
        success: true,
        data: product
      })
    } else {
      res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }
  } else {
    res.status(404).json({
      success: false,
      message: 'Category not found'
    })
  }
})

module.exports = router
