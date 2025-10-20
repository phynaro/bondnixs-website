const { productQueries } = require('../db/pool')

// Migration script to populate database with existing mock data
async function migrateProducts() {
  try {
    console.log('Starting product migration...')

    // Sample products based on the original mock data
    const productsToMigrate = [
      {
        model: 'DT-FN-200',
        name: 'DT-FN series Desktop Dispensing Robot',
        short_brief: 'High-precision desktop dispensing robot',
        description: 'Advanced desktop dispensing robot with precision control and flexible programming capabilities.',
        image_url: '/uploads/products/dtfns200.png',
        features: [
          'High precision positioning',
          'Flexible programming',
          'Easy operation interface',
          'Compact desktop design'
        ],
        specs: {
          'Positioning Accuracy': '±0.01mm',
          'Repeatability': '±0.005mm',
          'Working Area': '200 x 200 x 50mm',
          'Speed': '200mm/s',
          'Weight': '15kg'
        },
        published: true
      },
      {
        model: 'DT-200T',
        name: 'DT-200T 3-Axis Dispensing Robot',
        short_brief: '3-axis precision dispensing system',
        description: 'High-precision 3-axis dispensing robot for automated manufacturing applications.',
        image_url: '/uploads/products/dt200t.png',
        features: [
          '3-axis precision control',
          'High-speed operation',
          'Easy programming',
          'Compact design'
        ],
        specs: {
          'Axes': '3',
          'Positioning Accuracy': '±0.02mm',
          'Working Area': '200 x 200 x 100mm',
          'Speed': '300mm/s',
          'Weight': '20kg'
        },
        published: true
      },
      {
        model: '6000E',
        name: '6000E-Standard Dispenser',
        short_brief: 'Standard dispensing controller',
        description: 'Reliable standard dispensing controller for various applications.',
        image_url: '/uploads/products/6000e.png',
        features: [
          'Standard dispensing control',
          'Reliable operation',
          'Easy maintenance',
          'Cost-effective'
        ],
        specs: {
          'Control Type': 'Standard',
          'Input Voltage': '24 VDC',
          'Output Pressure': '0-100 psi',
          'Response Time': '<50ms',
          'Weight': '2kg'
        },
        published: true
      },
      {
        model: '9000F',
        name: '9000F Micro-pressing Processor Digital Dispenser',
        short_brief: 'Micro-pressing digital dispenser',
        description: 'Advanced micro-pressing processor with digital control for precision dispensing.',
        image_url: '/uploads/products/9000f.png',
        features: [
          'Micro-pressing technology',
          'Digital control',
          'High precision',
          'Programmable sequences'
        ],
        specs: {
          'Control Type': 'Digital',
          'Precision': '±0.001mm',
          'Pressure Range': '0-200 psi',
          'Input Voltage': '24 VDC',
          'Weight': '3kg'
        },
        published: true
      },
      {
        model: 'DV-300T',
        name: 'DV-300T-Diaphragm Valve',
        short_brief: 'Diaphragm dispensing valve',
        description: 'High-performance diaphragm valve for precise dispensing applications.',
        image_url: '/uploads/products/dv300t.png',
        features: [
          'Diaphragm technology',
          'Precise control',
          'Durable construction',
          'Easy maintenance'
        ],
        specs: {
          'Valve Type': 'Diaphragm',
          'Flow Rate': '0.1-10 ml/min',
          'Pressure Range': '0-100 psi',
          'Material': 'Stainless Steel',
          'Weight': '0.5kg'
        },
        published: true
      }
    ]

    // Insert products one by one
    for (const product of productsToMigrate) {
      try {
        await productQueries.createProduct(product)
        console.log(`✓ Migrated product: ${product.model} - ${product.name}`)
      } catch (error) {
        if (error.code === '23505') {
          console.log(`- Product ${product.model} already exists, skipping...`)
        } else {
          console.error(`✗ Failed to migrate product ${product.model}:`, error.message)
        }
      }
    }

    console.log('Product migration completed!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateProducts().then(() => {
    console.log('Migration script finished')
    process.exit(0)
  }).catch((error) => {
    console.error('Migration script failed:', error)
    process.exit(1)
  })
}

module.exports = { migrateProducts }
