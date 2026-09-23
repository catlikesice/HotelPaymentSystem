/**
 * Places that can be searched but do not have their own HTML page.
 * Loaded into the search database with a null page_url.
 * Descriptions follow the same "Browse hotels in …" city pattern as the catalog.
 */
module.exports = {
  cities: [
    {
      name: 'Nida',
      country: 'Lithuania',
      description: 'Browse hotels in Nida, Lithuania.'
    },
    {
      name: 'Barentsburg',
      country: 'Svalbard',
      description: 'Browse hotels in Barentsburg, Svalbard.'
    },
    {
      name: 'Pyramiden',
      country: 'Svalbard',
      description: 'Browse hotels in Pyramiden, Svalbard.'
    },
    {
      name: 'Abisko',
      country: 'Sweden',
      description: 'Browse hotels in Abisko, Sweden.'
    },
    {
      name: 'St Andrews',
      country: 'Scotland',
      description: 'Browse hotels in St Andrews, Scotland.'
    },
    {
      name: 'Fort William',
      country: 'Scotland',
      description: 'Browse hotels in Fort William, Scotland.'
    },
    {
      name: 'Oban',
      country: 'Scotland',
      description: 'Browse hotels in Oban, Scotland.'
    },
    {
      name: 'Palanga',
      country: 'Lithuania',
      description: 'Browse hotels in Palanga, Lithuania.'
    },
    {
      name: 'Druskininkai',
      country: 'Lithuania',
      description: 'Browse hotels in Druskininkai, Lithuania.'
    },
    {
      name: 'Trakai',
      country: 'Lithuania',
      description: 'Browse hotels in Trakai, Lithuania.'
    },
    {
      name: 'Porvoo',
      country: 'Finland',
      description: 'Browse hotels in Porvoo, Finland.'
    },
    {
      name: 'Kuopio',
      country: 'Finland',
      description: 'Browse hotels in Kuopio, Finland.'
    },
    {
      name: 'Savonlinna',
      country: 'Finland',
      description: 'Browse hotels in Savonlinna, Finland.'
    }
  ],
  hotels: [
    {
      name: 'Hotel Nida Marina',
      city: 'Nida',
      country: 'Lithuania',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80',
      price: '0.07 ETH / night',
      priceEth: 0.07,
      description: 'Lagoon-side hotel in Nida with dune views and a short walk to the fishing harbour.'
    },
    {
      name: 'Barentsburg Guesthouse',
      city: 'Barentsburg',
      country: 'Svalbard',
      image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80',
      price: '0.09 ETH / night',
      priceEth: 0.09,
      description: 'Compact guesthouse in Barentsburg, above the harbour and the historic mining settlement.'
    },
    {
      name: 'Pyramiden Harbour House',
      city: 'Pyramiden',
      country: 'Svalbard',
      image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80',
      price: '0.08 ETH / night',
      priceEth: 0.08,
      description: 'Simple harbour stay in Pyramiden for guided visits to the preserved mining town.'
    },
    {
      name: 'Abisko Mountain Lodge',
      city: 'Abisko',
      country: 'Sweden',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80',
      price: '0.08 ETH / night',
      priceEth: 0.08,
      description: 'Trailside lodge in Abisko, a base for the Kungsleden and clear winter nights.'
    },
    {
      name: 'St Andrews Harbour Hotel',
      city: 'St Andrews',
      country: 'Scotland',
      image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80',
      price: '0.08 ETH / night',
      priceEth: 0.08,
      description: 'Harbour hotel in St Andrews, a short walk from the cathedral ruins and the West Sands.'
    },
    {
      name: 'Ben Nevis Lodge',
      city: 'Fort William',
      country: 'Scotland',
      image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80',
      price: '0.07 ETH / night',
      priceEth: 0.07,
      description: 'Highland lodge in Fort William, with glen views and a path toward Ben Nevis.'
    },
    {
      name: 'Oban Bay Hotel',
      city: 'Oban',
      country: 'Scotland',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80',
      price: '0.06 ETH / night',
      priceEth: 0.06,
      description: 'Bayfront hotel in Oban, beside the ferry pier for the Hebridean islands.'
    },
    {
      name: 'Palanga Dune Hotel',
      city: 'Palanga',
      country: 'Lithuania',
      image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80',
      price: '0.05 ETH / night',
      priceEth: 0.05,
      description: 'Pine-backed hotel in Palanga, between the botanical park and the Baltic beach.'
    },
    {
      name: 'Druskininkai Spa House',
      city: 'Druskininkai',
      country: 'Lithuania',
      image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80',
      price: '0.06 ETH / night',
      priceEth: 0.06,
      description: 'Spa house in Druskininkai, near the Nemunas riverside promenade and the mineral springs.'
    },
    {
      name: 'Trakai Lake House',
      city: 'Trakai',
      country: 'Lithuania',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80',
      price: '0.05 ETH / night',
      priceEth: 0.05,
      description: 'Lakeside house in Trakai, a short walk from the island castle.'
    },
    {
      name: 'Porvoo Old Town Hotel',
      city: 'Porvoo',
      country: 'Finland',
      image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?fit=crop&w=400&q=80',
      price: '0.07 ETH / night',
      priceEth: 0.07,
      description: 'Old-town hotel in Porvoo, among the red shore warehouses on the Porvoonjoki.'
    },
    {
      name: 'Kuopio Lakefront Hotel',
      city: 'Kuopio',
      country: 'Finland',
      image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?fit=crop&w=400&q=80',
      price: '0.06 ETH / night',
      priceEth: 0.06,
      description: 'Lakefront hotel in Kuopio, close to the passenger harbour on Kallavesi.'
    },
    {
      name: 'Savonlinna Castle Hotel',
      city: 'Savonlinna',
      country: 'Finland',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=400&q=80',
      price: '0.08 ETH / night',
      priceEth: 0.08,
      description: 'Island hotel in Savonlinna, facing Olavinlinna across the strait.'
    }
  ]
};
