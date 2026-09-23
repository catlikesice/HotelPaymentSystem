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
    }
  ]
};
