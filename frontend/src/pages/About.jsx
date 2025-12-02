import { useState, useEffect } from 'react'
import { aboutContentAPI, getImageUrl } from '../services/api'

const About = () => {
  const [heroContent, setHeroContent] = useState(null)
  const [storyContent, setStoryContent] = useState(null)
  const [values, setValues] = useState([])
  const [stats, setStats] = useState([])
  const [commitmentItems, setCommitmentItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    try {
      const [heroResponse, storyResponse, valuesResponse, statsResponse, commitmentResponse] = await Promise.all([
        aboutContentAPI.getContentByType('hero'),
        aboutContentAPI.getContentByType('story'),
        aboutContentAPI.getContentByType('value'),
        aboutContentAPI.getContentByType('stat'),
        aboutContentAPI.getContentByType('commitment_item')
      ])
      
      if (heroResponse.data.data.length > 0) {
        setHeroContent(heroResponse.data.data[0])
      }
      if (storyResponse.data.data.length > 0) {
        setStoryContent(storyResponse.data.data[0])
      }
      setValues(valuesResponse.data.data)
      setStats(statsResponse.data.data)
      setCommitmentItems(commitmentResponse.data.data)
    } catch (error) {
      console.error('Error fetching about content:', error)
    } finally {
      setLoading(false)
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-900 to-primary-600 text-white py-20">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {heroContent?.title || 'About BONDNIXS'}
            </h1>
            <p className="text-xl text-primary-100">
              {heroContent?.description || 'Specialized engineering and distribution company founded by dispensing expert engineers'}
            </p>
          </div>
        </div>
      </section>

      {/* Company Story */}
      <section className="py-20">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  {storyContent?.title || 'Our Story'}
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  {storyContent?.description || 'BONDNIXS CO., LTD. is a specialized engineering and distribution company founded by dispensing expert engineers focusing on desktop robot and dispensing solutions.'}
                </p>
                {storyContent?.content?.paragraphs && storyContent.content.paragraphs.map((paragraph, index) => (
                  <p key={index} className="text-lg text-gray-600 mb-6">
                    {paragraph}
                  </p>
                ))}
              </div>
              <div className="bg-gray-100 rounded-lg p-8">
                <div className="text-center">
                  {storyContent?.image_url ? (
                    <img 
                      src={getImageUrl(storyContent.image_url)} 
                      alt={storyContent?.title || 'BONDNIXS'} 
                      className="w-32 h-32 object-contain mx-auto mb-6"
                    />
                  ) : (
                    <img 
                      src="/logo.jpg" 
                      alt="BONDNIXS Logo" 
                      className="w-32 h-32 object-contain mx-auto mb-6"
                    />
                  )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">BONDNIXS CO., LTD.</h3>
                  <p className="text-gray-600">Engineering Excellence Since 2014</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values & Culture */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Values & Culture
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our core values drive everything we do and shape our commitment to excellence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value) => (
              <div key={value.id} className="text-center p-6 bg-white rounded-lg shadow-md">
                {value.image_url && (
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
                    <img
                      src={getImageUrl(value.image_url)}
                      alt={value.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experience & Expertise */}
      <section className="py-20">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
              Our Experience & Expertise
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {stats.map((stat) => (
                <div key={stat.id} className="text-center">
                  <div className="text-4xl font-bold text-primary-600 mb-2">{stat.title}</div>
                  <div className="text-lg text-gray-600">{stat.description}</div>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 rounded-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Our Commitment
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                We are committed to delivering reliable, high-quality engineering solutions that add value to our customers' operations. Our team of expert engineers ensures that every project meets the highest standards of quality and performance.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                {commitmentItems.map((item) => (
                  <div key={item.id}>
                    <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default About
