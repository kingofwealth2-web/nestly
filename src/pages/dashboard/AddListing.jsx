import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function AddListing() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [imageUploading, setImageUploading] = useState(false)

  const [form, setForm] = useState({
    title: '', description: '', category_id: '',
    address: '', city: '', lat: '', lng: '',
    price_range: '', price_from: '',
    tags: '', open_hours: '',
    cover_image: '',
    status: 'active',
    services: '',
    prices: '',

  })

  useEffect(() => {
    fetchCategories()
    if (isEdit) fetchListing()
  }, [id])

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*')
    setCategories(data || [])
  }

  async function fetchListing() {
    const { data } = await supabase.from('listings').select('*').eq('id', id).single()
    if (data) {
      setForm({
        title: data.title || '',
        description: data.description || '',
        category_id: data.category_id || '',
        address: data.address || '',
        city: data.city || '',
        lat: data.lat || '',
        lng: data.lng || '',
        price_range: data.price_range || '',
        price_from: data.price_from || '',
        tags: data.tags?.join(', ') || '',
        open_hours: data.open_hours ? JSON.stringify(data.open_hours) : '',
        cover_image: data.cover_image || '',
        status: data.status || 'active',
        services: data.services ? data.services.join(', ') : '',
        prices: data.prices ? JSON.stringify(data.prices) : '',

      })
      if (data.cover_image) setImagePreview(data.cover_image)
    }
  }

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function uploadImage() {
    if (!imageFile) return form.cover_image || ''
    setImageUploading(true)
    const ext = imageFile.name.split('.').pop()
    const path = `listings/${user.id}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('listing-images')
      .upload(path, imageFile, { upsert: true })
    setImageUploading(false)
    if (uploadError) {
      setError('Image upload failed: ' + uploadError.message)
      return form.cover_image || ''
    }
    const { data: { publicUrl } } = supabase.storage
      .from('listing-images')
      .getPublicUrl(path)
    return publicUrl
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.title || !form.category_id || !form.city) {
      setError('Title, category, and city are required.')
      return
    }
    setLoading(true)

    const coverImageUrl = await uploadImage()
    if (error) { setLoading(false); return } // uploadImage set the error already

    const payload = {
      owner_id: user.id,
      title: form.title,
      description: form.description,
      category_id: form.category_id,
      address: form.address,
      city: form.city,
      lat: form.lat ? parseFloat(form.lat) : null,
      lng: form.lng ? parseFloat(form.lng) : null,
      price_range: form.price_range,
      price_from: form.price_from ? parseFloat(form.price_from) : null,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      cover_image: coverImageUrl,
      status: form.status,
      services: form.services ? form.services.split(',').map(s => s.trim()).filter(Boolean) : [],
      prices: (() => {
        if (!form.prices.trim()) return null
        try {
          // Try JSON first, else parse "Item: Price" lines
          return JSON.parse(form.prices)
        } catch {
          return form.prices.split('\n').map(line => {
            const [name, ...rest] = line.split(':')
            return { name: name?.trim(), price: rest.join(':').trim() }
          }).filter(p => p.name && p.price)
        }
      })(),
    }

    let error
    if (isEdit) {
      ;({ error } = await supabase.from('listings').update(payload).eq('id', id))
    } else {
      ;({ error } = await supabase.from('listings').insert(payload))
    }

    setLoading(false)
    if (error) { setError(error.message); return }
    navigate('/dashboard/listings')
  }

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.8rem', color: 'var(--text)' }}>
          {isEdit ? 'Edit listing' : 'Add a listing'}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-light)', marginTop: '.2rem' }}>
          {isEdit ? 'Update your listing details.' : 'Fill in the details to publish your listing.'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {error && <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 9, padding: '.75rem 1rem', fontSize: 13, color: '#DC2626', marginBottom: '1.25rem' }}>{error}</div>}

        <Card title="Cover image">
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {imagePreview && (
              <div style={{ width: 160, height: 110, borderRadius: 10, overflow: 'hidden', flexShrink: 0, border: '1.5px solid var(--border)' }}>
                <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 220 }}>
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '.5rem', border: '2px dashed var(--border)', borderRadius: 10, padding: '1.5rem', cursor: 'pointer', background: 'var(--cream)', transition: 'border-color .2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--teal)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-mid)' }}>{imageFile ? imageFile.name : 'Click to upload image'}</span>
                <span style={{ fontSize: 11, color: 'var(--text-light)' }}>PNG, JPG, WEBP up to 5MB</span>
                <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
              </label>
              <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: '.5rem' }}>
                Images are stored in Supabase Storage. Make sure the <code>listing-images</code> bucket is public.
              </p>
            </div>
          </div>
        </Card>

        <Card title="Basic information">
          <Field label="Listing title *">
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Bella Vista Restaurant" style={inputStyle} required />
          </Field>
          <Field label="Category *">
            <select value={form.category_id} onChange={e => set('category_id', e.target.value)} style={inputStyle} required>
              <option value="">Select a category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </Field>
          <Field label="Description">
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} placeholder="Describe your listing..." style={{ ...inputStyle, resize: 'vertical' }} />
          </Field>
          <Field label="Tags (comma separated)">
            <input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="e.g. Fine Dining, Rooftop, Bar" style={inputStyle} />
          </Field>
        </Card>

        <Card title="Location">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field label="Address">
              <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Street address" style={inputStyle} />
            </Field>
            <Field label="City *">
              <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Accra" style={inputStyle} required />
            </Field>
            <Field label="Latitude (for map pin)">
              <input type="number" step="any" value={form.lat} onChange={e => set('lat', e.target.value)} placeholder="e.g. 5.6037" style={inputStyle} />
            </Field>
            <Field label="Longitude (for map pin)">
              <input type="number" step="any" value={form.lng} onChange={e => set('lng', e.target.value)} placeholder="e.g. -0.1870" style={inputStyle} />
            </Field>
          </div>
        </Card>

        <Card title="Pricing">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field label="Price display (shown on card)">
              <input value={form.price_range} onChange={e => set('price_range', e.target.value)} placeholder="e.g. From GH₵80 or GH₵950/mo" style={inputStyle} />
            </Field>
            <Field label="Starting price (number, for filters)">
              <input type="number" value={form.price_from} onChange={e => set('price_from', e.target.value)} placeholder="e.g. 80" style={inputStyle} />
            </Field>
          </div>
        </Card>

        <Card title="Extra services">
          <Field label="Services offered (comma separated)">
            <input value={form.services} onChange={e => set('services', e.target.value)} placeholder="e.g. Free WiFi, Parking, Delivery, Home visits, Air conditioning" style={inputStyle} />
          </Field>
          <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: '.25rem' }}>These appear as feature badges on your listing.</p>
        </Card>

        <Card title="Price list">
          <Field label="Add items and prices — one per line, format: Item name: Price">
            <textarea
              value={form.prices}
              onChange={e => set('prices', e.target.value)}
              rows={5}
              placeholder={"Lunch special: GH₵80\nDinner set: GH₵150\nCoffee: GH₵25\nRoom (standard): GH₵450/night"}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            />
          </Field>
          <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: '.25rem' }}>Shown as a price table on your listing page.</p>
        </Card>

        <Card title="Status">
          <Field label="Listing status">
            <select value={form.status} onChange={e => set('status', e.target.value)} style={inputStyle}>
              <option value="active">Active — visible to everyone</option>
              <option value="inactive">Inactive — hidden from search</option>
            </select>
          </Field>
        </Card>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => navigate('/dashboard/listings')} style={{ padding: '.75rem 1.5rem', border: '1.5px solid var(--border)', borderRadius: 9, background: '#fff', color: 'var(--text-mid)', fontFamily: 'DM Sans, sans-serif', fontSize: 14, cursor: 'pointer' }}>
            Cancel
          </button>
          <button type="submit" disabled={loading || imageUploading} style={{ padding: '.75rem 1.75rem', background: (loading || imageUploading) ? '#aaa' : 'var(--teal)', color: '#fff', border: 'none', borderRadius: 9, fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, cursor: (loading || imageUploading) ? 'not-allowed' : 'pointer' }}>
            {imageUploading ? 'Uploading image...' : loading ? 'Saving...' : isEdit ? 'Save changes' : 'Publish listing'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Card({ title, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid var(--border)', padding: '1.5rem', marginBottom: '1.25rem' }}>
      <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.05rem', color: 'var(--text)', marginBottom: '1.25rem', paddingBottom: '.75rem', borderBottom: '1.5px solid var(--border)' }}>{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: '.35rem' }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '.7rem 1rem',
  border: '1.5px solid var(--border)', borderRadius: 8,
  fontFamily: 'DM Sans, sans-serif', fontSize: 14,
  color: 'var(--text)', background: 'var(--cream)', outline: 'none',
}