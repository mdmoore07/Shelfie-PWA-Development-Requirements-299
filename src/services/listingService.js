import supabase from '../lib/supabase'

export const fetchUserListings = async () => {
  try {
    const { data, error } = await supabase
      .from('listings_a7b3c9d2f1')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching listings:', error)
    return { data: null, error }
  }
}

export const createListing = async (listingData) => {
  try {
    const { data, error } = await supabase
      .from('listings_a7b3c9d2f1')
      .insert([listingData])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error creating listing:', error)
    return { data: null, error }
  }
}

export const updateListing = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('listings_a7b3c9d2f1')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error updating listing:', error)
    return { data: null, error }
  }
}

export const deleteListing = async (id) => {
  try {
    const { error } = await supabase
      .from('listings_a7b3c9d2f1')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Error deleting listing:', error)
    return { error }
  }
}

export const getListingById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('listings_a7b3c9d2f1')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error getting listing:', error)
    return { data: null, error }
  }
}

export const getListingStats = async () => {
  try {
    const { data, error } = await supabase
      .from('listings_a7b3c9d2f1')
      .select('status')

    if (error) throw error

    const stats = {
      totalListings: data.length,
      draftListings: data.filter(l => l.status === 'draft').length,
      postedListings: data.filter(l => l.status === 'posted').length,
      soldListings: data.filter(l => l.status === 'sold').length,
    }

    return { data: stats, error: null }
  } catch (error) {
    console.error('Error getting listing stats:', error)
    return { 
      data: {
        totalListings: 0,
        draftListings: 0,
        postedListings: 0,
        soldListings: 0
      }, 
      error 
    }
  }
}